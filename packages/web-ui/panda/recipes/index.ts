import { appLayoutRecipe } from './app-layout.recipe';
import { badgeRecipe } from './badge.recipe';
import { bannerRecipe } from './banner.recipe';
import { buttonRecipe } from './button.recipe';
import { cellRecipe } from './cell.recipe';
import { checkboxRecipe } from './checkbox.recipe';
import { colorDotRecipe } from './color-dot.recipe';
import { iconPickerRecipe } from './icon-picker.recipe';
import { iconRecipe } from './icon.recipe';
import { inputRecipe } from './input.recipe';
import { listRecipe } from './list.recipe';
import { modalRecipe } from './modal.recipe';
import { pageHeaderRecipe } from './page-header.recipe';
import { spinnerRecipe } from './spinner.recipe';
import { switchRecipe } from './switch.recipe';
import { tableCellRecipe } from './table-cell.recipe';
import { textRecipe } from './text.recipe';
import { wordCellRecipe } from './word-cell.recipe';

export const recipes = {
    badge: badgeRecipe,
    button: buttonRecipe,
    colorDot: colorDotRecipe,
    icon: iconRecipe,
    spinner: spinnerRecipe,
    text: textRecipe
};

export const slotRecipes = {
    appLayout: appLayoutRecipe,
    banner: bannerRecipe,
    cell: cellRecipe,
    checkbox: checkboxRecipe,
    iconPicker: iconPickerRecipe,
    input: inputRecipe,
    list: listRecipe,
    modal: modalRecipe,
    pageHeader: pageHeaderRecipe,
    tableCell: tableCellRecipe,
    toggle: switchRecipe,
    wordCell: wordCellRecipe
};
