import { diffTrees } from 'diff-trees';

export type DTreeNode<T> =  {
  id: string;
  parent?: DTreeNode<T>;
  left?: DTreeNode<T>;
  right?: DTreeNode<T>;
  children: DTreeNode<T>[];
  value: T;

}

// export class DNode<T> implements DTreeNode<T> {
//     id: string;
//     parent?: DTreeNode<T> | undefined;
//     left?: DTreeNode<T> | undefined;
//     right?: DTreeNode<T> | undefined;
//     children: DTreeNode<T>[];
//     value: T;
//     constructor(id: string, value: T, rels?: { parent?: DTreeNode<T>, left?: DTreeNode<T>, right?: DTreeNode<T> }) {
//       this.id = id;
//       this.value = value;
//       this.parent = rels?.parent;
//       this.children = [];
//       this.left = rels?.left;
//       this.right = rels?.right;
//     }
//
//
//     // just to avoid garbage collection circular references
//     [Symbol.dispose]() {
//       for (const child of this.children) {
//         child.parent = undefined;
//       }
//       this.children = [];
//
//       if (this.parent)
//         this.parent.children.splice(this.parent.children.indexOf(this), 1);
//       this.parent = undefined;
//
//       if (this.left)
//         this.left.right = undefined;
//       this.left = undefined;
//       if (this.right)
//         this.right.left = undefined;
//       this.right = undefined;
//     }
//
//
// }

export function fillSiblings<Y,T extends DTreeNode<Y>>(children: T[]) {
  for (let i = 0; i < children.length; i++) {
    const leftIdx = i - 1;
    const rightIdx = i + 1;
    if (leftIdx >= 0) {
      children[i].left = children[leftIdx];
    }
    if (rightIdx < children.length) {
      children[i].right = children[rightIdx];
    }
  }
  return children;
}


export function BFS<T>(root: T | T[], getChildren: (arg0: T) => T[] | undefined, visit: (arg0: T) => void) {
  const nodesToVisit: T[] = Array.isArray(root) ? root : [root];
  while (nodesToVisit.length > 0) {
    const currentNode = nodesToVisit.shift() as T;
    nodesToVisit.push(...(getChildren(currentNode) ?? []));
    // nodesToVisit = [
    //   ...nodesToVisit,
    //   ...(getChildren(currentNode) || []),
    // ];
    visit(currentNode);
  }
}

export function* BFSGen<T>(root: T | T[], getChildren: (arg0: T) => T[] | undefined): Generator<T> {
  const nodesToVisit: T[] = Array.isArray(root) ? root : [root];
  while (nodesToVisit.length > 0) {
    const currentNode = nodesToVisit.shift() as T;
    nodesToVisit.push(...getChildren(currentNode) ?? []);
    // nodesToVisit = [
    //   ...nodesToVisit,
    //   ...(getChildren(currentNode) || []),
    // ];
    yield currentNode;
  }
}

export function DFS<T>(root: T, getChildren: (arg0: T) => T[] | undefined, visit: (arg0: T) => void) {
  const nodesToVisit: T[] = Array.isArray(root) ? root : [root];
  while (nodesToVisit.length > 0) {
    // guaranteed defined due to while loop check (barring race conditions...)
    const currentNode = nodesToVisit.shift() as T;
    nodesToVisit.unshift(...(getChildren(currentNode) ?? []));
    // nodesToVisit = [
    //   ...(getChildren(currentNode) || []),
    //   ...nodesToVisit,
    // ];
    visit(currentNode);
  }
}

export function* DFSGen<T>(root: T | T[], getChildren: (arg0: T) => T[] | undefined): Generator<T, void, void> {
  const nodesToVisit: T[] = Array.isArray(root) ? root : [root];
  while (nodesToVisit.length > 0) {
    const currentNode = nodesToVisit.shift() as T;
    nodesToVisit.unshift(...(getChildren(currentNode) ?? []));
    // nodesToVisit = [
    //   ...(getChildren(currentNode) || []),
    //   ...nodesToVisit,
    // ];
    yield currentNode;
  }
  return;
}

/**
 * Finds the top level differences between two trees
 * Does not recurse into children once a difference is detected
 * @param oldTree
 * @param newTree
 */
export function findTopLevelDiff<T>(oldTree: DTreeNode<T>, newTree: DTreeNode<T>) {
  return diffTrees(oldTree, newTree,{
    valueEquality: (a, b) => a === b,
  });


}



export type SerializedTreeItem<T> = {
  id: string;
  children?: SerializedTreeItem<T>[]
} & T

export function deserializeTreeItems<T extends Record<string, T[keyof T]>>(inp: SerializedTreeItem<T>[]): DTreeNode<T>[] {
  const items = inp.map((x) => deserializeTreeItem(x));
  return fillSiblings(items);

}

export function deserializeTreeItem<T extends Record<string, T[keyof T]>>(inp: SerializedTreeItem<T>, parent?: DTreeNode<T>): DTreeNode<T> {

  const r: DTreeNode<T> = {

    value: {} as T,
    id: inp.id,
    children: [],
    parent: parent,
  };
  for (const inpKey in inp) {
    if (inpKey === 'id' || inpKey === 'children') {
      continue;
    }
    // @ts-expect-error - we know this is a valid key
    (r.value[inpKey]) = inp[inpKey as keyof T];
  }
  if (inp.children) {
    r.children = inp.children?.map((x) => deserializeTreeItem(x, r));
    fillSiblings(r.children);
  }
  return r;
}
