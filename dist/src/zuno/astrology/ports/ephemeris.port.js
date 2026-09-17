"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRAHA_ORDER = exports.Graha = exports.EPHEMERIS = void 0;
exports.EPHEMERIS = Symbol('ZUNO_EPHEMERIS');
var Graha;
(function (Graha) {
    Graha["SUN"] = "SUN";
    Graha["MOON"] = "MOON";
    Graha["MARS"] = "MARS";
    Graha["MERCURY"] = "MERCURY";
    Graha["JUPITER"] = "JUPITER";
    Graha["VENUS"] = "VENUS";
    Graha["SATURN"] = "SATURN";
    Graha["RAHU"] = "RAHU";
    Graha["KETU"] = "KETU";
})(Graha || (exports.Graha = Graha = {}));
exports.GRAHA_ORDER = [
    Graha.SUN,
    Graha.MOON,
    Graha.MARS,
    Graha.MERCURY,
    Graha.JUPITER,
    Graha.VENUS,
    Graha.SATURN,
    Graha.RAHU,
    Graha.KETU,
];
//# sourceMappingURL=ephemeris.port.js.map