import { DTreeNode as TreeNode, findTopLevelDiff } from './tree_utils';
import { describe, expect, it } from 'vitest';


describe('TreeUtils', () => {
  it('should work', () => {
    const tree1: TreeNode<string> = {
      id: 'root',
      value: 'root',
      children: [
        {
          value: 'child1',
          id: 'child1',
          children: [],

        },
      ],
    };
    const tree2: TreeNode<string> = {
      id: 'root',
      value: 'root',
      children: [
        {
          value: 'child1',
          id: 'child1',
          children: [
            {
              value: 'grandchild1',
              children: [],
              id: 'grandchild1',
            },
          ],
        },
      ],
    };
    expect(findTopLevelDiff(tree1, tree2)).toBe(null);

  });
});
