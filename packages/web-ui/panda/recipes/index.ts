import { badgeRecipe } from './badge.recipe';
import { bannerRecipe } from './banner.recipe';
import { buttonRecipe } from './button.recipe';
import { cellRecipe } from './cell.recipe';
import { checkboxRecipe } from './checkbox.recipe';
import { iconRecipe } from './icon.recipe';
import { inputRecipe } from './input.recipe';
import { listRecipe } from './list.recipe';
import { spinnerRecipe } from './spinner.recipe';
import { switchRecipe } from './switch.recipe';
import { textRecipe } from './text.recipe';

export const recipes = {
    badge: badgeRecipe,
    button: buttonRecipe,
    icon: iconRecipe,
    spinner: spinnerRecipe,
    text: textRecipe
};

export const slotRecipes = {
    banner: bannerRecipe,
    cell: cellRecipe,
    checkbox: checkboxRecipe,
    input: inputRecipe,
    list: listRecipe,
    toggle: switchRecipe
};
