import { type QueryFunc } from './GridCombo';
import { PopupSearch, PSDataSource } from './PopupSearch';
import './PopupSearch.css';

const getColor = (): string =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;

const colorize = (): void => {
  const btn = document.getElementById('btn');
  btn?.addEventListener('click', () => {
    document.documentElement.style.setProperty(
      '--head-color-start',
      getColor(),
    );
    document.documentElement.style.setProperty('--head-color-end', getColor());
  });
};
const gridItems: string[][] = [
  ['a', 'b', 'c', 'd'],
  ['a', 'b', 'c', 'd'],
];

function set_rows(grid_el: HTMLTableElement, rows: string[][]): void {
  const body_el = grid_el.querySelector('tbody')!;
  body_el.append(
    ...rows.map((x, i) => {
      const tr = document.createElement('tr');
      tr.id = grid_el.id + '-row-' + i.toString(10);
      tr.innerHTML = x
        .map(
          (s, cell_idx) =>
            `<td id="${tr.id + '-cell-' + cell_idx.toString(10)}">${s}</td>`,
        )
        .join('');
      return tr;
    }),
  );
}

const FRUITS_AND_VEGGIES: [string, string][] = [
  ['Apple', 'Fruit'],
  ['Artichoke', 'Vegetable'],
  ['Asparagus', 'Vegetable'],
  ['Banana', 'Fruit'],
  ['Beets', 'Vegetable'],
  ['Bell pepper', 'Vegetable'],
  ['Broccoli', 'Vegetable'],
  ['Brussels sprout', 'Vegetable'],
  ['Cabbage', 'Vegetable'],
  ['Carrot', 'Vegetable'],
  ['Cauliflower', 'Vegetable'],
  ['Celery', 'Vegetable'],
  ['Chard', 'Vegetable'],
  ['Chicory', 'Vegetable'],
  ['Corn', 'Vegetable'],
  ['Cucumber', 'Vegetable'],
  ['Daikon', 'Vegetable'],
  ['Date', 'Fruit'],
  ['Edamame', 'Vegetable'],
  ['Eggplant', 'Vegetable'],
  ['Elderberry', 'Fruit'],
  ['Fennel', 'Vegetable'],
  ['Fig', 'Fruit'],
  ['Garlic', 'Vegetable'],
  ['Grape', 'Fruit'],
  ['Honeydew melon', 'Fruit'],
  ['Iceberg lettuce', 'Vegetable'],
  ['Jerusalem artichoke', 'Vegetable'],
  ['Kale', 'Vegetable'],
  ['Kiwi', 'Fruit'],
  ['Leek', 'Vegetable'],
  ['Lemon', 'Fruit'],
  ['Mango', 'Fruit'],
  ['Mangosteen', 'Fruit'],
  ['Melon', 'Fruit'],
  ['Mushroom', 'Fungus'],
  ['Nectarine', 'Fruit'],
  ['Okra', 'Vegetable'],
  ['Olive', 'Vegetable'],
  ['Onion', 'Vegetable'],
  ['Orange', 'Fruit'],
  ['Parsnip', 'Vegetable'],
  ['Pea', 'Vegetable'],
  ['Pear', 'Fruit'],
  ['Pineapple', 'Fruit'],
  ['Potato', 'Vegetable'],
  ['Pumpkin', 'Fruit'],
  ['Quince', 'Fruit'],
  ['Radish', 'Vegetable'],
  ['Rhubarb', 'Vegetable'],
  ['Shallot', 'Vegetable'],
  ['Spinach', 'Vegetable'],
  ['Squash', 'Vegetable'],
  ['Strawberry', 'Fruit'],
  ['Sweet potato', 'Vegetable'],
  ['Tomato', 'Fruit'],
  ['Turnip', 'Vegetable'],
  ['Ugli fruit', 'Fruit'],
  ['Victoria plum', 'Fruit'],
  ['Watercress', 'Vegetable'],
  ['Watermelon', 'Fruit'],
  ['Yam', 'Vegetable'],
  ['Zucchini', 'Vegetable'],
];
const searchVeggies: QueryFunc<readonly ['name', 'type']> = (
  searchString: string,
) => {
  const results = [];

  for (let i = 0; i < FRUITS_AND_VEGGIES.length; i++) {
    const veggie = FRUITS_AND_VEGGIES[i][0].toLowerCase();
    if (veggie.indexOf(searchString.toLowerCase()) === 0) {
      results.push(FRUITS_AND_VEGGIES[i]);
    }
  }

  return results;
};

function setup_combo(el: HTMLElement) {
  const gridId = el.getAttribute('aria-owns');
  if (gridId === null) {
    throw new Error('combobox is missing aria-owns attribute');
  }
  const gridEl = document.getElementById(gridId);
  if (gridEl === null) {
    throw new Error('invalid id found in aria-owns attribute on combobox');
  }
  set_rows(gridEl as HTMLTableElement, gridItems);

  el.addEventListener('keyup', (ev) => {
    switch (ev.code) {
      case 'ArrowDown':
        if (el.getAttribute('aria-expanded') === 'false') {
          el.setAttribute('aria-expanded', 'true');
        }
        break;
      case 'Escape':
        if (el.getAttribute('aria-expanded') === 'true') {
          el.setAttribute('aria-expanded', 'false');
        }
        break;
      default:
        console.log('keyup received', ev.code, ev.key);
        break;
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const ds: PSDataSource = async (query: string) => {
    // const r: LeftSideContent[] = [];
    console.log('query', query);
    return FRUITS_AND_VEGGIES.filter((x) =>
      x[0].toLowerCase().includes(query.toLowerCase()),
    ).map((x) => {
      const div = document.createElement('div');
      div.innerText = x[0];

      return {
        text: x[0],
        href: x[1],
        id: FRUITS_AND_VEGGIES.indexOf(x).toString(10),
        rsc: { children: [div] },
      };
    });
    // for (let i = 0; i < 10; i++) {
    //   r.push({
    //
    //     text: query + i.toString(10),
    //     href: 'https://google.com/' + i.toString(10),
    //   });
    // }
    // return r;
  };
  new PopupSearch('combo_p1', ds);
  // new ListBoxCombo({ root: 'list-combo1', replace:true, ds: searchVeggies });
  //
  // colorize();
  // document.getElementById('btn1')!.addEventListener('click', async () => {
  //   const overlay = document.getElementById('t1')!;
  //   overlay.addEventListener('fullscreenchange', () => {
  //     if (document.fullscreenElement) {
  //       overlay.style.display = 'block';
  //       console.log('Entered fullscreen');
  //     } else {
  //       overlay.style.display = 'none';
  //       console.log('Exited fullscreen');
  //     }
  //   });
  //   const s = await overlay?.requestFullscreen({ navigationUI: 'show' });
  //
  //   console.log(s);
  // });
  // const r = document.getElementById('cgrid1') as HTMLInputElement;
  // const combo = new GridCombo(r, ['name', 'type'], searchVeggies);
  // // document.querySelectorAll('[role="combobox"][aria-haspopup="grid"]').forEach(x => {
  // //   setup_combo(x as HTMLElement);
  // // });
  // const i = document.getElementById('tgrid1') as HTMLInputElement;
  // const tr = deserializeTreeItems([{
  //   href: 'https://google.com/',
  //   id: 'item1',
  //   name: ' root',
  //   children: [{
  //     name: 'test',
  //     href: '#ww',
  //     id: 'nn1',
  //   }],
  // }, {
  //   id: 'ewww',
  //   href: '',
  //   name: 'ewww',
  // }]);
  //
  // function q(arg0: string): TreeItem[] {
  //   console.log('filtering', arg0);
  //   return tr.filter(x => x.value.name.includes(arg0));
  // }
  //
  // new TreeCombo(i, q);
});
