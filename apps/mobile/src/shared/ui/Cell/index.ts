import { CellContainer } from './Cell';
import {
    CellContent,
    CellImage,
    CellRow,
    CellTitle,
    CellSubtitle,
    CellValue,
    CellSubvalue
} from './components';

export const Cell = Object.assign(CellContainer, {
    Image: CellImage,
    Content: CellContent,
    Row: CellRow,
    Title: CellTitle,
    Subtitle: CellSubtitle,
    Value: CellValue,
    Subvalue: CellSubvalue
});
