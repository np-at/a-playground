import { DFSGen, DTreeNode } from './tree_utils';
import { firstOrDefault } from './utils';

export type TreeItemVal = {
  name: string;
  href: string;
}
export type TreeItem = DTreeNode<TreeItemVal>;
// For an array of TreeItem, supplies the left and right properties with references to adjacent nodes
// modifies in place
// returns the input array (does not copy)

// export type TreeItem = DTreeNode<{ name:string }>;
// {
//   id: string;
//   children?: TreeItem[]
//
//   href: string
//   name: string;
//   parent?: TreeItem;
//   left?: TreeItem;
//   right?: TreeItem;
//
// }
// const comboHtmlSkele = `<label for="tgrid1"> Tree Grid Combo</label>
//   <input id="tgrid1" aria-controls="tgrid1-pop"/>
//   <ul id="tgrid1-pop" role="tree" class="tree-grid-popup">
//   </ul>`;
const SUBTREE_GROUP_CLASS = 'subtree-group';

function makeTreeItemHtmlNode(treeItem: TreeItem): HTMLElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'none');
  li.setAttribute('id', treeItem.id);
  const a = document.createElement('a');
  a.setAttribute('role', 'treeitem');
  a.setAttribute('href', treeItem.value.href);
  a.setAttribute('tabindex', '-1');
  const linkId = `${treeItem.id}-link`;
  a.setAttribute('id', linkId);

  const label = document.createElement('span');
  label.innerText = treeItem.value.name;

  a.appendChild(label);
  li.appendChild(a);

  if (treeItem.children?.length) {
    a.setAttribute('aria-expanded', 'false');
    const subtreeGroup = document.createElement('ul');
    const subtreeGroupId = `${treeItem.id}-subtree`;
    subtreeGroup.setAttribute('id', subtreeGroupId);
    subtreeGroup.setAttribute('role', 'group');
    subtreeGroup.setAttribute('aria-labelledby', treeItem.id);
    subtreeGroup.classList.add(SUBTREE_GROUP_CLASS);
    a.setAttribute('aria-owns', subtreeGroupId);
    subtreeGroup.append(...treeItem.children.map((x) => makeTreeItemHtmlNode(x)));

    li.appendChild(subtreeGroup);
  }


  return li;

}

export class TreeCombo {
  _nodeMap: WeakMap<TreeItem, HTMLElement> = new WeakMap();
  gridpopup: HTMLElement;
  treeItems: TreeItem[] = [];
  focusedNode?: TreeItem;

  constructor(protected rootInput: HTMLInputElement, protected ds: (arg0: string) => TreeItem[]) {
    const gridId = this.rootInput.getAttribute('aria-controls');
    if (!gridId) throw new Error('aria-controls not found on root input');
    const gridEl = document.getElementById(gridId);
    if (!gridEl) throw new Error(`element with id ${gridId} not found`);
    this.gridpopup = gridEl;
    this.setEventListeners();
  }

  get expanded(): boolean {
    return this.rootInput.getAttribute('aria-expanded') === 'true';
  }

  get focusedNodeEl(): HTMLElement | null {
    if (this.focusedNode?.id)
      return this.gridpopup.querySelector(`#${this.focusedNode.id}`);
    return null;
  }

  get focusedNodeLink(): HTMLAnchorElement | null {
    const n = this.focusedNodeEl;
    if (!n) {
      return n;
    }
    return n.querySelector('a');
  }

  get focusedNodeGroup(): HTMLElement | null {
    const n = this.focusedNodeEl;
    if (!n) {
      return n;
    }
    return n.querySelector(`.${SUBTREE_GROUP_CLASS}`);
  }

  _nodeLinkFromTreeItem(item: TreeItem): HTMLElement | null {
    return this.gridpopup.querySelector(`#${item.id} a`);
  }

  focusNode(el: TreeItem) {
    // remove active styling from old one before we lose the reference
    this.focusedNodeLink?.classList.remove('active');
    this.focusedNode = el;
    if (!this.focusedNodeLink?.id) {
      throw new Error('unable to acquire focused node link id ');
    }
    this.rootInput.setAttribute('aria-activedescendant', this.focusedNodeLink.id);
    this.focusedNodeLink?.classList.add('active');
  }

  setEventListeners(): void {

    this.rootInput.addEventListener('keyup', this.handleKeyPress.bind(this));

    this.rootInput.addEventListener('blur', () => this.collapse());
  }

  public submit() {
    this.collapse();
  }

  updateGridItems() {
    const updatedItems = this.ds(this.rootInput.value);
    // this.treeItems = this.ds(this.rootInput.value);
    this.gridpopup.replaceChildren(...this.treeItems.map((x) => makeTreeItemHtmlNode(x)));
  }

  public expand() {
    this.updateGridItems();
    this.rootInput.setAttribute('aria-expanded', 'true');
    const { left, bottom, width } = this.rootInput.getBoundingClientRect();
    console.log(this.rootInput.getBoundingClientRect());
    this.gridpopup.style.setProperty('top', bottom.toString(10) + 'px');
    // this.gridpopup.style.top = bottom.toString(10);
    // this.gridpopup.style.left = left.toString(10);
    this.gridpopup.style.setProperty('left', left.toString(10) + 'px');
    this.gridpopup.style.setProperty('min-width', width.toString(10) + 'px');
    // this.gridpopup.style.minWidth = width.toString(10);
    this.treeItems.length && this.focusNode(this.treeItems[0]);
    this.gridpopup.classList.add('open');


  }

  public collapse() {
    this.rootInput.setAttribute('aria-expanded', 'false');
    this.rootInput.removeAttribute('aria-activedescendant');
    this.gridpopup.classList.remove('open');
    this.focusedNode = undefined;
  }

  private handleArrowHorizontal(ev: KeyboardEvent, direction: 'ArrowLeft' | 'ArrowRight') {
    if (!this.expanded) {
      return;
    }

    if (this.focusedNode && this.focusedNode.children) {
      let expandedState: string | null | undefined;
      if (!this.focusedNodeLink) {
        expandedState = null;
      } else {
        const expandedAttr = this.focusedNodeLink.getAttribute('aria-expanded');
        expandedState = expandedAttr ?? undefined;
      }
      switch (expandedState) {
        case null:
          // unable to locate focused node?!?!
          console.dir(this.focusedNode);
          throw new Error('Unable to locate focused node');
        case undefined:
          // not expandable
          if (direction === 'ArrowLeft')
            this.focusedNode.parent && this.focusNode(this.focusedNode.parent);
          else
            console.debug('received ArrowRight on non-expandable node, ignoring');
          break;
        case 'true':
          if (direction === 'ArrowLeft') {
            this.focusedNodeLink?.setAttribute('aria-expanded', 'false');
          } else {
            this.focusNode(this.focusedNode.children[0]);
          }
          break;
        case 'false':
          if (direction === 'ArrowLeft') {
            this.focusedNode?.parent && this.focusNode(this.focusedNode.parent);
          } else {
            this.focusedNodeLink?.setAttribute('aria-expanded', 'true');
          }
          break;
        default:
          throw new Error(`Expanded state: ${expandedState} not handled.  This should never happen`);
      }
      ev.stopPropagation();
      ev.preventDefault();
    }
  }

  private moveFocusNext() {
    if (this.focusedNode?.children && this.focusedNodeLink?.getAttribute('aria-expanded') === 'true') {
      // prioritize descending into expanded children first
      this.focusNode(this.focusedNode?.children[0]);
    } else if (this.focusedNode?.right) {
      this.focusNode(this.focusedNode.right);
    } else if (this.focusedNode?.parent?.right) {
      this.focusNode(this.focusedNode.parent.right);
    }
  }

  private moveFocusPrev() {
    let node;
    // traversal order of priority (high --> low)
    // 1. direct sibling
    // 2. deepest 1st cousin (in the backwards direction)
    // 3. sibling of parent
    // 4. parent
    if (this.focusedNode?.left) {
      node = this.focusedNode.left;
    } else if (this.focusedNode?.parent?.left) {
      node = this.focusedNode.parent.left;
    } else if (this.focusedNode?.parent) {
      node = this.focusedNode.parent;
    } else {
      // no-op
      return;
    }
    const gen = DFSGen(node, (arg0: TreeItem): TreeItem[] | undefined => {
      // stop descending on unexpanded nodes
      if (arg0.children) {
        if (this._nodeLinkFromTreeItem(arg0)?.getAttribute('aria-expanded') === 'true') {
          // we want the last child to be surfaced first, so reverse
          return arg0.children.toReversed();
        }
      }
      return undefined;
    });
    const f = firstOrDefault(gen, node, (arg1) => {
      // make sure it doesn't pick up the currently focused node,
      // also ignore the first appearance of the root node as it's not relevant until
      // we've exhausted all of it's descendants
      return (arg1.id !== node.id && arg1.id !== this.focusedNode?.id);
    });
    this.focusNode(f);

  }

  private handleKeyPress(ev: KeyboardEvent): void {
    switch (ev.key) {
      case 'ArrowUp':
        if (this.expanded) {
          if (this.focusedNode) {
            this.moveFocusPrev();
          }
          ev.stopPropagation();
          ev.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (this.expanded) {
          this.moveFocusNext();
        } else {
          this.expand();
        }
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowLeft':
        this.handleArrowHorizontal(ev, ev.key);

        break;
      case 'ArrowRight':
        this.handleArrowHorizontal(ev, ev.key);
        break;
      case 'Enter':
        this.submit();
        break;
      case 'Escape':
        this.collapse();
        break;
      default:
        this.updateGridItems();
        this.treeItems.length && this.focusNode(this.treeItems[0]);
        break;
    }
  }

}
