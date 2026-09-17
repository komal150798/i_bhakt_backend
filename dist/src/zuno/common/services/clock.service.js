"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedClockService = exports.ClockService = void 0;
const common_1 = require("@nestjs/common");
let ClockService = class ClockService {
    now() {
        return new Date();
    }
    nowIso() {
        return this.now().toISOString();
    }
    today() {
        return this.now().toISOString().slice(0, 10);
    }
};
exports.ClockService = ClockService;
exports.ClockService = ClockService = __decorate([
    (0, common_1.Injectable)()
], ClockService);
class FixedClockService extends ClockService {
    constructor(current) {
        super();
        this.current = current;
    }
    now() {
        return new Date(this.current);
    }
    set(date) {
        this.current = new Date(date);
    }
    advanceMs(ms) {
        this.current = new Date(this.current.getTime() + ms);
    }
}
exports.FixedClockService = FixedClockService;
//# sourceMappingURL=clock.service.js.map