"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilities = void 0;
class Utilities {
    static result(promise) {
        return promise
            .then((result) => ([result, undefined]))
            .catch((error) => ([undefined, error]));
    }
}
exports.Utilities = Utilities;
