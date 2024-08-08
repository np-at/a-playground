export type ListBoxComboProps = {
  ds: (arg0: string) => Promise<ListBoxData[]> | ListBoxData[];
} & SelectorType;
type SelectorType = SelectorTypeId | SelectorTypeElement;
type SelectorTypeId = {
  root: string;
  replace: boolean;
}
type SelectorTypeElement = {
  root: HTMLInputElement;
}

function baseHtml(rootId: string): string {
  const listboxId = rootId + '-listbox';
  return `<input type="text" id="${rootId}" aria-expanded="false" aria-controls="${listboxId}" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" />
  <ul id="${listboxId}" role="listbox"></ul>
`;
}

export type RowData = [display: string, value: string];
export type GroupData = [label: string, rows: RowData[]];
export type ListBoxData = (RowData | GroupData);

export class ListBoxCombo {
  root: HTMLInputElement;
  listbox: HTMLUListElement;
  ds: ListBoxComboProps['ds'];
  max_preview_items: number = 20;

  constructor(props: ListBoxComboProps) {
    if ('replace' in props) {
      let el = document.getElementById(props.root);
      if (!el) {
        throw new Error(`element with id ${props.root} not found`);
      }
      if (props.replace) {
        el.outerHTML = baseHtml(props.root);
        // need to refresh reference after replacing
        el = document.getElementById(props.root);
        this.root = el as HTMLInputElement;
      } else {
        this.root = el as HTMLInputElement;
      }
    } else {
      this.root = props.root;
    }
    this.ds = props.ds;
    const listboxId = this.root.getAttribute('aria-controls');
    if (listboxId === null) {
      throw new Error('combobox is missing aria-controls attribute');
    }

    const listboxEl = document.getElementById(listboxId) as HTMLUListElement | null;
    if (listboxEl === null) {
      throw new Error('invalid id found in aria-controls attribute on combobox');
    }
    this.listbox = listboxEl;

  }

  get expanded(): boolean {
    return this.root.getAttribute('aria-expanded') === 'true';
  }

  async update() {
    const rr = await this.ds(this.root.value);
    this.set_rows(this.max_preview_items && (this.max_preview_items < rr.length) ? rr.slice(0, this.max_preview_items - 1) : rr);
  }

  async expand() {
    await this.update();
    this.root.setAttribute('aria-expanded', 'true');
  }

  collapse() {
    this.root.setAttribute('aria-expanded', 'false');
    this.root.removeAttribute('aria-activedescendant');
  }


  private set_rows(row_vals: ListBoxData[]) {
    this.listbox.replaceChildren(...row_vals.map((x, i) => {
      if (Array.isArray(x[1])) {
        const [groupLabel, rowData] = x;
        const group = document.createElement('optgroup');
        group.setAttribute('label', groupLabel);
        group.append(...rowData.map((y, j) => {
          const li = document.createElement('li');
          const [lineLabel, lineValue] = y;
          li.setAttribute('role', 'option');
          li.setAttribute('id', `listbox-option-${i}-${j}`);
          li.setAttribute('value', lineValue);
          li.innerText = lineLabel;
          return li;
        }));
        return group;
      }
      const li = document.createElement('li');
      const [lineLabel, lineValue] = x;
      li.setAttribute('role', 'option');
      li.setAttribute('id', `listbox-option-${i}`);
      li.innerText = lineLabel;
      li.setAttribute('value', lineValue);
      return li;

    }));
  }

  inputKeyUpHandler(ev: KeyboardEvent) {
    switch (ev.code) {
      case 'ArrowDown':
        if (!this.expanded)
          void this.expand();
        else {

        }
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowUp':
        if (this.expanded) {


          ev.stopPropagation();
          ev.preventDefault();
        }
        break;

      case 'Enter':

        break;
      case 'Escape':
        this.collapse();
        ev.stopPropagation();
        break;
      default:
        void this.update();
        break;
    }
  }
}
