import './PopupSearch.css';

function baseHtml(
  rootId: string,
  popupId: string,
  popupSecondaryId: string,
  popupListId: string,
  popupAriaLiveId: string,
): string {
  return `
<div class="searchbox" role="searchbox">
  <input type="search" id="${rootId}" aria-expanded="false" aria-controls="" />
  <button id="search-button">Search</button>
  
  <template id="${rootId}-search-result-item-template">
    <li>
      <a href=""></a>
      <button class="secondary-expand" aria-expanded="false" aria-controls="" aria-label="expand secondary content"></button>
      <div class="secondary"></div>
    </li>
</template>
<dialog class="search-results" id="${popupId}" >
<ul id="${popupListId}" class="search-results-primary"></ul>
<div id="${popupSecondaryId}" class="search-results-secondary"></div>
</dialog>
<div class="hide-me" id="${popupAriaLiveId}" aria-live="assertive"  aria-atomic="true"></div>

</div>
`;
}

export type LeftSideContent = {
  id?: string;
  text: string;
  href: string;
  rsc?: RightSideContent;
};
export type PSDataSource = (query: string) => Promise<LeftSideContent[]>;
export type RightSideContent = {
  children: HTMLElement[];
};

export class PopupSearch {
  _selectedIdx: number = -1;
  private readonly _searchInput: HTMLInputElement;
  private readonly _searchButton: HTMLButtonElement;
  private readonly _searchResults: HTMLDialogElement;
  private readonly _searchResultsList: HTMLUListElement;
  private readonly _searchResultItemTemplate: HTMLTemplateElement;
  private readonly _datasource: PSDataSource;
  private _ariaAnnouncer: HTMLDivElement;
  private _t?: number;
  private readonly rootId: string;

  constructor(rootId: string, ds: PSDataSource) {
    this.rootId = rootId;
    this._datasource = ds;
    let el = document.getElementById(rootId);
    if (!el) {
      throw new Error(`element with id ${rootId} not found`);
    }
    const popupId = rootId + '-search-results';
    const popupListId = popupId + '-list';
    const popupSecondaryId = popupId + '-secondary';
    const popupAriaLiveId = popupId + '-aria-live';
    el.outerHTML = baseHtml(
      rootId,
      popupId,
      popupSecondaryId,
      popupListId,
      popupAriaLiveId,
    );
    el = document.getElementById(rootId);
    this._searchInput = el as HTMLInputElement;
    this._searchButton = document.getElementById(
      'search-button',
    ) as HTMLButtonElement;
    this._searchResults = document.getElementById(
      `${rootId}-search-results`,
    ) as HTMLDialogElement;
    this._searchResultsList = document.getElementById(
      popupListId,
    ) as HTMLUListElement;
    this._searchResultItemTemplate = document.getElementById(
      rootId + '-search-result-item-template',
    ) as HTMLTemplateElement;
    this._ariaAnnouncer = document.getElementById(
      popupAriaLiveId,
    ) as HTMLDivElement;
    this.setEventHandlers();
  }

  public get expanded(): boolean {
    return this._searchInput.getAttribute('aria-expanded') === 'true';
  }

  get selection(): HTMLElement | null {
    return this._searchResultsList.querySelector(
      `li:nth-child(${this._selectedIdx + 1})`,
    );
  }

  set selection(idx: number) {
    this.selection?.classList.remove('selected');
    this._selectedIdx = idx;
    const sel = this.selection;
    if (sel) {
      sel.classList.add('selected');
      sel.scrollIntoView({ block: 'nearest' });
    }
  }

  makeSRAnnouncement(text: string) {
    this._ariaAnnouncer.innerText = text;
  }

  async refreshResults() {
    // this.selection?.classList.remove('selected');
    const results = await this._datasource(this._searchInput.value);

    this.populateResults(results);
    this.selection = 0;

    // this.selection?.classList.add('selected');
  }

  expand(): void {
    // this._selectedIdx = 0;
    void this.refreshResults();
    // void this._datasource(this._searchInput.value).then((results) =>
    //   this.populateResults(results),
    // ).then(()=>    this.selection?.classList.add('selected'));
    document.body.addEventListener('keyup', this.escHandler.bind(this), {});
    this._searchInput.setAttribute('aria-expanded', 'true');

    this._searchResults.setAttribute('open', '');
    this.makeSRAnnouncement('search results expanded');
  }

  collapse(): void {
    this._searchInput.setAttribute('aria-expanded', 'false');
    this._searchResults.close();
    this._selectedIdx = -1;
    document.body.removeEventListener('keyup', this.escHandler.bind(this), {});
    // this._searchInput.removeAttribute('aria-activedescendant');
  }

  /** Results list population */
  populateLSN(content: LeftSideContent) {
    const n = this._searchResultItemTemplate.content.cloneNode(
      true,
    ) as DocumentFragment;
    // n.id = content.id;
    const li = n.querySelector('li') as HTMLLIElement;
    content.id && (li.id = this.rootId + '-result-' + content.id);

    const a = n.querySelector('a');
    if (!a) {
      throw new Error('unable to find anchor element in search result item');
    }
    a.textContent = content.text;
    a.href = content.href;
    a.id = this.rootId + '-search-result-item-' + content.id;

    const expansionTrigger = n.querySelector(
      'button.secondary-expand',
    ) as HTMLButtonElement;
    expansionTrigger.addEventListener('click', () => {
      li.getAttribute('aria-expanded') === 'true'
        ? expansionTrigger.setAttribute('aria-expanded', 'false')
        : expansionTrigger.setAttribute('aria-expanded', 'true');
      this.expandSecondary(li.id);
    });

    const secondary = n.querySelector('.secondary') as HTMLDivElement;
    if (content.rsc) {
      a.classList.add('has-secondary');
      secondary.append(...content.rsc.children);
    }

    secondary.setAttribute('role', 'group');
    secondary.setAttribute('aria-labelledby', a.id);
    // secondary.textContent = 'secondary content';
    // if (content.rsc) {
    //   secondary.append(...content.rsc.chilren);
    // }

    return n;
  }

  populateResults(results: LeftSideContent[]): void {
    this._searchResultsList.replaceChildren(
      ...results.map(this.populateLSN.bind(this)),
    );
    this._t && window.clearTimeout(this._t);
    this._t = window.setTimeout(() => {
      this._t = undefined;
      this.makeSRAnnouncement(
        'search results populated with ' +
          this._searchResultsList.children.length +
          ' items',
      );
    }, 1500);
  }

  /** Event Handlers */
  setEventHandlers(): void {
    this._searchInput.addEventListener(
      'keyup',
      this.inputKeyUpHandler.bind(this),
    );
  }

  inputKeyUpHandler(ev: KeyboardEvent): void {
    switch (ev.code) {
      case 'ArrowDown':
        if (this._searchInput.getAttribute('aria-expanded') === 'false') {
          this.expand();
        } else {
          this.selectNext();
        }
        ev.stopPropagation();
        ev.preventDefault();
        console.log('current selection', this._selectedIdx);
        break;
      case 'ArrowUp':
        if (this.expanded) {
          this.selectPrevious();
        }
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'Escape':
        this.collapse();
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowRight':
        this.expandSecondary();
        break;
      case 'ArrowLeft':
        this.selection?.querySelector('div')?.classList.remove('open');
        break;
      default:
        if (this._searchInput.value.length > 2) {
          this.expanded || this.expand();
          // void this.refreshResults();
        }
    }
  }

  setSecondaryExpanded(expanded: boolean, id?: string) {
    let target = this.selection;
    if (id) {
      const el = this._searchResultsList.querySelector(`#${id}`);
      if (el) {
        target = el as HTMLElement | null;
      }
    }

  }

  expandSecondary(id?: string) {
    this._searchResultsList.querySelectorAll('li.expanded').forEach((el) => {
      el.classList.remove('expanded');
      el
        .querySelector('button.secondary-expand')
        ?.setAttribute('aria-expanded', 'false');
    });
    // this.selection?.classList.remove('expanded');
    // this._searchResultsList.querySelectorAll('li > div.open').forEach((el) => {
    //   el.classList.remove('open');
    // });
    // this.selection?.querySelector('div')?.classList.add('open');
    let target = this.selection;
    if (id) {
      const el = this._searchResultsList.querySelector(`#${id}`);
      if (el) {
        target = el as HTMLElement | null;
      }
    }
    target?.classList.add('expanded');
    target
      ?.querySelector('button.secondary-expand')
      ?.setAttribute('aria-expanded', 'true');
  }

  escHandler(ev: KeyboardEvent) {
    console.log('esc handler called', ev);
    if (ev.code === 'Escape') {
      this.collapse();
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  selectPrevious() {
    // this.selection?.classList.remove('selected');

    this.selection =
      (this._selectedIdx - 1 + this._searchResultsList.children.length) %
      this._searchResultsList.children.length;

    // this.selection?.classList.add('selected');
  }

  private selectNext() {
    // this.selection?.classList.remove('selected');

    this.selection =
      (this._selectedIdx + 1) % this._searchResultsList.children.length;
    // this._selectedIdx =

    // this.selection?.classList.add('selected');
  }
}
