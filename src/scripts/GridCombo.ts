import { escapeHtml } from './html_escape';
import type { FixedArray } from './util_types';
import { memoize } from './utils';

export type QueryFunc<C extends ReadonlyArray<string>> = (arg0: string) => Promise<FixedArray<string, C['length']>[]> | FixedArray<string, C['length']>[];

const ActiveCellClass = 'active';


export default class GridCombo<const E extends readonly string[]> {
  max_preview_items?: number;
  input: HTMLInputElement;
  grid: HTMLTableElement;
  grid_body: HTMLTableSectionElement;
  ds: QueryFunc<E>;

  cols: E;
  rowIndex = 0;
  colIndex = 0;

  opts?: ReturnType<typeof this.ds>;


  constructor(el: HTMLInputElement, cols: E, data_source: QueryFunc<E>, private submitAction?: (arg0: string) => Promise<void> | void) {
    this.input = el;
    this.ds = memoize(data_source, (a, b) => a === b);
    const gridId = el.getAttribute('aria-controls');
    if (gridId === null) {
      throw new Error('combobox is missing aria-controls attribute');
    }
    const gridEl = document.getElementById(gridId) as HTMLTableElement | null;
    if (gridEl === null) {
      throw new Error('invalid id found in aria-controls attribute on combobox');
    }
    this.grid = gridEl;
    const gridBody = this.grid.querySelector('tbody');
    if (gridBody === null) {
      throw new Error('No tbody found for grid');
    }
    this.grid_body = gridBody;
    this.cols = cols;
    this.init_input();
    this._init();
  }

  public get expanded(): boolean {
    return this.input.getAttribute('aria-expanded') === 'true';
  }

  /**
   * Setup methods
   */
  init_input(): void {
    this.input.addEventListener('keyup', this.inputKeyUpHandler.bind(this));

  }

  /**
   * Actions
   */


  async expand() {

    await this.update();
    // display attribute  of the popup is controlled by css looking for a preceding [aria-expanded="true"] (from display: none; to display: [some])
    return this.input.setAttribute('aria-expanded', 'true');
  }

  collapse() {
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
  }

  select_item(el: HTMLTableCellElement): void {
    console.debug(`triggered selection for ${el.id}`, el);
    const rowVal = el.parentElement?.querySelector('td:first-child');
    if (!rowVal) {
      throw new Error('value cell for row not found');
    }
    this.input.value = (rowVal as HTMLTableCellElement).innerText;

    this.collapse();
    void this.submitAction?.(this.input.value);
  }

  _init(): void {
    this.grid.addEventListener('click', this.gridClickHandler.bind(this));
  }

  /**
   * Utility methods
   */


  set_rows(rows: string[][]): void {
    this.grid_body.replaceChildren(...rows.map((x, i) => {
      const tr = document.createElement('tr');
      tr.id = this.grid.id + '-row-' + i.toString(10);
      tr.innerHTML = x.map((s, cell_idx) => `<td id="${tr.id + '-cell-' + cell_idx.toString(10)}">${escapeHtml(s)}</td>`).join('');
      return tr;
    }));
    this.rowIndex = 0;
    this.colIndex = 0;
  }

  async update() {
    const rr = await this.ds(this.input.value);
    this.set_rows(this.max_preview_items && (this.max_preview_items < rr.length) ? rr.slice(0, this.max_preview_items - 1) : rr);
  }

  getCellAtCoords(row: number, col: number): HTMLTableCellElement | undefined {
    const cellId = `${this.grid.id}-row-${row.toString(10)}-cell-${col.toString(10)}`;
    const selectedCell: HTMLTableCellElement | null = this.grid_body.querySelector('#' + cellId);
    return selectedCell ?? undefined;
  }

  setSelectedPos(row: number, col: number): void {
    if (this.rowIndex === row && this.colIndex === col) {
      // console.trace('position unchanged, not processing selection position');
      return;
    }
    // make sure cell at coords exists
    // const cellId = `${this.grid.id}-row-${row.toString(10)}-cell-${col.toString(10)}`;
    // const selectedCell: HTMLTableCellElement | null = this.grid_body.querySelector('#' + cellId);
    const selectedCell = this.getCellAtCoords(row, col);
    if (!selectedCell) {
      throw new Error(`no cell found at (${row}, ${col})`);
    }
    this.rowIndex = row;
    this.colIndex = col;
    const prevActiveDescendant = this.input.getAttribute('aria-activedescendant');
    if (prevActiveDescendant !== null) {
      this.grid_body.querySelector(`#${prevActiveDescendant}`)?.classList.remove(ActiveCellClass);
    }
    this.input.setAttribute('aria-activedescendant', selectedCell.id);
    selectedCell.classList.add(ActiveCellClass);

  }

  /**
   * Event Handlers
   */

  gridClickHandler(ev: MouseEvent): void {
    console.log('click on grid', ev);
    if (!ev.target) {
      return;
    }
    if (this.grid.contains(ev.target as HTMLElement)) {
      if ((ev.target as HTMLElement).tagName === 'TD') {
        this.select_item(ev.target as HTMLTableCellElement);
      }
    }

    // let row;

  }

  inputKeyUpHandler(ev: KeyboardEvent): void {
    console.log('keypress', ev);
    switch (ev.key) {
      case 'ArrowDown':
        if (!this.expanded)
          void this.expand();
        else {

          this.setSelectedPos(Math.min(this.grid_body.childElementCount - 1, this.rowIndex + 1), this.colIndex);
        }
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowUp':
        if (this.expanded) {

          this.setSelectedPos(Math.max(0, this.rowIndex - 1), this.colIndex);
          ev.stopPropagation();
          ev.preventDefault();
        }
        break;
      case 'ArrowRight':

        this.setSelectedPos(this.rowIndex, Math.min(this.cols.length - 1, this.colIndex + 1));
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowLeft':
        this.setSelectedPos(this.rowIndex, Math.max(0, this.colIndex - 1));
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'Enter':
        // eslint-disable-next-line no-case-declarations
        const selected = this.getCellAtCoords(this.rowIndex, this.colIndex);
        if (!selected)
          break;
        this.select_item(selected);
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
//
// function query<C extends ReadonlyArray<string>>(arg0: string): FixedArray<string, C['length']>[] {
//   const _a = arg0;
//   // const ess: FixedArray<string, 3> = ['','','']
//   return [];
// }
//
// const cols = ['test', 'fight', 'poop'] as const;
// const ss: QueryFunc<typeof cols> = () => ([['a', 'b', 'ee']]);
// const g = new GridCombo(new HTMLInputElement(), cols, ss);
// const tt = g.ds('');
