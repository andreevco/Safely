import { JsonValue } from "../json";
import { isContainerSlot } from "../slots";
import { cloneDeep } from "../slots/slot-json";
import { JsonStorageSelection } from "./selection";

export function createWriteProxy(selection: JsonStorageSelection): unknown {
  return new Proxy(Object.create(null), {
    get: (_target, prop) => {
      if (typeof prop !== "string") {
        return undefined;
      }

      const slot = selection.get(prop);

      if (slot === undefined || slot.d === true) {
        return undefined;
      }

      if (isContainerSlot(slot)) {
        const childSelection = selection.select(prop);

        if (childSelection === undefined) {
          return undefined;
        }

        return createWriteProxy(childSelection);
      }

      return cloneDeep(slot.v);
    },

    set: (_target, prop, value) => {
      if (typeof prop !== "string") {
        return false;
      }

      selection.set(prop, value as JsonValue);

      return true;
    },

    deleteProperty: (_target, prop) => {
      if (typeof prop !== "string") {
        return false;
      }

      selection.delete(prop);

      return true;
    },
  });
}
