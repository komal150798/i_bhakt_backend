"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KundliService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KundliService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const kundli_planet_entity_1 = require("../entities/kundli-planet.entity");
const kundli_house_entity_1 = require("../entities/kundli-house.entity");
const swiss_ephemeris_service_1 = require("../../astrology/services/swiss-ephemeris.service");
const ai_kundli_service_1 = require("../../astrology/services/ai-kundli.service");
const customer_entity_1 = require("../../users/entities/customer.entity");
const DASHA_SEQUENCE = [
    'Ketu',
    'Venus',
    'Sun',
    'Moon',
    'Mars',
    'Rahu',
    'Jupiter',
    'Saturn',
    'Mercury',
];
const PLANET_YEARS = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
};
const TOTAL_CYCLE_YEARS = 120;
const NAKSHATRA_SPAN = 40 / 3;
const SIDEREAL_YEAR_DAYS = 365.256363004;
const MS_PER_DAY = 86400000;
const JD_UNIX_EPOCH = 2440587.5;
const NAKSHATRA_LORDS = [
    'Ketu',
    'Venus',
    'Sun',
    'Moon',
    'Mars',
    'Rahu',
    'Jupiter',
    'Saturn',
    'Mercury',
    'Ketu',
    'Venus',
    'Sun',
    'Moon',
    'Mars',
    'Rahu',
    'Jupiter',
    'Saturn',
    'Mercury',
    'Ketu',
    'Venus',
    'Sun',
    'Moon',
    'Mars',
    'Rahu',
    'Jupiter',
    'Saturn',
    'Mercury',
];
let KundliService = KundliService_1 = class KundliService {
    constructor(httpService, kundliRepository, kundliPlanetRepository, kundliHouseRepository, customerRepository, swissEphemerisService, aiKundliService, configService) {
        this.httpService = httpService;
        this.kundliRepository = kundliRepository;
        this.kundliPlanetRepository = kundliPlanetRepository;
        this.kundliHouseRepository = kundliHouseRepository;
        this.customerRepository = customerRepository;
        this.swissEphemerisService = swissEphemerisService;
        this.aiKundliService = aiKundliService;
        this.configService = configService;
        this.logger = new common_1.Logger(KundliService_1.name);
        this.useAICalculation = this.configService.get('USE_AI_KUNDLI') === 'true';
        this.pythonApiUrl = this.configService.get('PYTHON_KUNDLI_URL') || 'http://localhost:8000';
        this.logger.log(`Kundli calculation mode: ${this.useAICalculation ? 'AI-based' : 'Swiss Ephemeris'}`);
        this.logger.log(`Python Kundli API URL: ${this.pythonApiUrl}`);
    }
    async generateKundli(dto, userId) {
        try {
            const birthDateTime = new Date(`${dto.birth_date}T${dto.birth_time}`);
            let { latitude, longitude, timezone } = dto;
            if (!latitude || !longitude) {
                const coords = await this.getCoordinatesFromPlace(dto.birth_place);
                latitude = coords.latitude;
                longitude = coords.longitude;
                timezone = coords.timezone || 'Asia/Kolkata';
            }
            let transformedData;
            if (userId) {
                try {
                    transformedData = await this.calculateWithPythonAPI(dto, userId, latitude, longitude, timezone || 'Asia/Kolkata');
                    this.logger.log('Kundli generated via Python Swiss Ephemeris API');
                    return transformedData;
                }
                catch (pythonError) {
                    this.logger.warn(`Python API unavailable, falling back to local calculation: ${pythonError?.message || pythonError}`);
                }
            }
            if (this.useAICalculation && this.aiKundliService) {
                this.logger.log('Using AI for kundli calculation');
                try {
                    const aiData = await this.aiKundliService.calculateKundli({
                        birthDate: dto.birth_date,
                        birthTime: dto.birth_time,
                        birthPlace: dto.birth_place,
                        latitude,
                        longitude,
                        timezone: timezone || 'Asia/Kolkata',
                    });
                    const aiMoon = aiData.planets?.find((p) => p.name === 'Moon');
                    let moonLongitude;
                    if (aiMoon) {
                        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                        const signIndex = signs.indexOf(aiMoon.sign);
                        if (signIndex !== -1) {
                            moonLongitude = signIndex * 30 + (aiMoon.degrees || 0);
                        }
                    }
                    const dashaTimeline = this.calculateVimshottariDasha(birthDateTime, aiData.nakshatra.name, aiData.nakshatra.lord, moonLongitude);
                    transformedData = this.transformAIKundliResponse(aiData, dto, dashaTimeline, { latitude, longitude, timezone: timezone || 'Asia/Kolkata' });
                }
                catch (aiError) {
                    this.logger.warn(`AI calculation failed, falling back to Swiss Ephemeris: ${aiError}`);
                    transformedData = await this.calculateWithSwissEphemeris(dto, birthDateTime, latitude, longitude, timezone || 'Asia/Kolkata');
                }
            }
            else {
                transformedData = await this.calculateWithSwissEphemeris(dto, birthDateTime, latitude, longitude, timezone || 'Asia/Kolkata');
            }
            if (userId) {
                await this.saveKundliToDatabase(userId, dto, transformedData, latitude, longitude, timezone);
            }
            return transformedData;
        }
        catch (error) {
            this.logger.error('Error generating kundli:', error);
            const message = error?.response?.data?.message || error?.message || 'Failed to generate kundli';
            throw new common_1.BadRequestException(message);
        }
    }
    async calculateWithPythonAPI(dto, userId, latitude, longitude, timezone) {
        this.logger.log(`Calling Python Kundli API at ${this.pythonApiUrl}/v1/kundli/generate`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.pythonApiUrl}/v1/kundli/generate`, {
            user_id: userId,
            name: dto.name,
            birth_date: dto.birth_date,
            birth_time: dto.birth_time,
            birth_place: dto.birth_place,
            latitude,
            longitude,
            timezone,
            ayanamsa: dto.ayanamsa || 1,
        }, {
            timeout: 30000,
        }));
        const data = response.data;
        if (!data.success) {
            throw new common_1.BadRequestException('Python API returned error');
        }
        return {
            name: dto.name,
            birth_date: dto.birth_date,
            birth_time: dto.birth_time,
            birth_place: dto.birth_place,
            latitude,
            longitude,
            timezone,
            lagna: {
                sign: data.lagna.name,
                degrees: data.lagna.degrees,
                lord: this.getSignLord(data.lagna.name),
            },
            nakshatra: {
                name: data.nakshatra.name,
                pada: data.nakshatra.pada,
                lord: data.nakshatra.lord,
            },
            planets: data.planets.map((p) => ({
                name: p.name,
                longitude: p.longitude,
                latitude: 0,
                sign: p.sign,
                sign_lord: p.sign_lord,
                nakshatra: p.nakshatra,
                nakshatra_lord: p.nakshatra_lord,
                nakshatra_pada: p.nakshatra_pada,
                house: p.house,
                is_retrograde: p.is_retrograde,
            })),
            houses: data.houses.map((h) => ({
                house_number: h.house_number,
                sign: h.sign,
                sign_lord: h.sign_lord,
                start_degree: h.cusp_degrees,
                end_degree: 0,
            })),
            ayanamsa: data.ayanamsa,
            tithi: data.panchanga?.tithi || '',
            yoga: data.panchanga?.yoga || '',
            karana: data.panchanga?.karana || '',
            dasha_timeline: data.dasha_timeline,
            full_data: data,
        };
    }
    getSignLord(signName) {
        const signLords = {
            Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
            Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
            Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
            Mesha: 'Mars', Vrishabha: 'Venus', Mithuna: 'Mercury', Karka: 'Moon',
            Simha: 'Sun', Kanya: 'Mercury', Tula: 'Venus', Vrishchika: 'Mars',
            Dhanu: 'Jupiter', Makara: 'Saturn', Kumbha: 'Saturn', Meena: 'Jupiter',
        };
        return signLords[signName] || '';
    }
    async calculateWithSwissEphemeris(dto, birthDateTime, latitude, longitude, timezone) {
        this.logger.log('Using Swiss Ephemeris for kundli calculation');
        const swissData = await this.swissEphemerisService.calculateKundli({
            datetime: birthDateTime,
            latitude,
            longitude,
            timezone,
            ayanamsa: dto.ayanamsa || 1,
        });
        const planetsWithHouses = this.swissEphemerisService.assignPlanetsToHouses(swissData.planets, swissData.houses);
        const moon = swissData.planets.find((p) => p.name === 'Moon');
        const moonLongitude = moon?.longitude;
        const dashaTimeline = this.calculateVimshottariDasha(birthDateTime, swissData.nakshatra.name, swissData.nakshatra.lord, moonLongitude, dto.dasha_balance_years);
        return this.transformSwissEphemerisResponse(swissData, dto, planetsWithHouses, dashaTimeline, { latitude, longitude, timezone });
    }
    transformSwissEphemerisResponse(swissData, dto, planetsWithHouses, dashaTimeline, calculatedCoords) {
        const latitude = dto.latitude || calculatedCoords?.latitude || 0;
        const longitude = dto.longitude || calculatedCoords?.longitude || 0;
        const timezone = dto.timezone || calculatedCoords?.timezone || 'Asia/Kolkata';
        return {
            name: dto.name,
            birth_date: dto.birth_date,
            birth_time: dto.birth_time,
            birth_place: dto.birth_place,
            latitude,
            longitude,
            timezone,
            lagna: {
                sign: swissData.lagna.sign,
                degrees: swissData.lagna.degrees,
                lord: swissData.lagna.signLord,
            },
            nakshatra: {
                name: swissData.nakshatra.name,
                pada: swissData.nakshatra.pada,
                lord: swissData.nakshatra.lord,
            },
            planets: planetsWithHouses.map((planet) => ({
                name: planet.name,
                longitude: planet.longitude,
                latitude: planet.latitude,
                sign: planet.sign,
                sign_lord: planet.signLord,
                nakshatra: planet.nakshatra,
                nakshatra_lord: planet.nakshatraLord,
                nakshatra_pada: planet.nakshatraPada,
                house: planet.house,
                is_retrograde: planet.isRetrograde,
            })),
            houses: swissData.houses.map((house) => ({
                house_number: house.houseNumber,
                sign: house.sign,
                sign_lord: house.signLord,
                start_degree: house.startDegree,
                end_degree: house.endDegree,
            })),
            ayanamsa: swissData.ayanamsa,
            tithi: swissData.tithi || '',
            yoga: swissData.yoga || '',
            karana: swissData.karana || '',
            dasha_timeline: dashaTimeline || null,
            full_data: {
                ...swissData,
                dasha_timeline: dashaTimeline,
            },
        };
    }
    transformAIKundliResponse(aiData, dto, dashaTimeline, calculatedCoords) {
        const latitude = dto.latitude || calculatedCoords?.latitude || 0;
        const longitude = dto.longitude || calculatedCoords?.longitude || 0;
        const timezone = dto.timezone || calculatedCoords?.timezone || 'Asia/Kolkata';
        const signLords = {
            Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
            Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
            Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
        };
        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const lagnaSignIndex = signs.indexOf(aiData.lagna.sign);
        const houses = [];
        for (let i = 0; i < 12; i++) {
            const signIndex = (lagnaSignIndex + i) % 12;
            const sign = signs[signIndex];
            houses.push({
                house_number: i + 1,
                sign,
                sign_lord: signLords[sign],
                start_degree: 0,
                end_degree: 30,
            });
        }
        return {
            name: dto.name,
            birth_date: dto.birth_date,
            birth_time: dto.birth_time,
            birth_place: dto.birth_place,
            latitude,
            longitude,
            timezone,
            lagna: {
                sign: aiData.lagna.sign,
                degrees: aiData.lagna.degrees,
                lord: aiData.lagna.signLord,
            },
            nakshatra: {
                name: aiData.nakshatra.name,
                pada: aiData.nakshatra.pada,
                lord: aiData.nakshatra.lord,
            },
            planets: aiData.planets.map((planet) => ({
                name: planet.name,
                longitude: (signs.indexOf(planet.sign) * 30) + planet.degrees,
                latitude: 0,
                sign: planet.sign,
                sign_lord: planet.signLord,
                nakshatra: planet.nakshatra,
                nakshatra_lord: planet.nakshatraLord,
                nakshatra_pada: planet.nakshatraPada,
                house: planet.house,
                is_retrograde: planet.isRetrograde,
            })),
            houses,
            ayanamsa: aiData.ayanamsa,
            tithi: aiData.tithi || '',
            yoga: aiData.yoga || '',
            karana: aiData.karana || '',
            dasha_timeline: dashaTimeline || null,
            full_data: {
                ...aiData,
                dasha_timeline: dashaTimeline,
            },
        };
    }
    async getCoordinatesFromPlace(place) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: place,
                    format: 'json',
                    limit: 1,
                },
                headers: {
                    'User-Agent': 'I-Bhakt-Kundli-Service',
                },
            }));
            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    latitude: Number.parseFloat(result.lat),
                    longitude: Number.parseFloat(result.lon),
                    timezone: 'Asia/Kolkata',
                };
            }
        }
        catch (error) {
            this.logger.warn(`Failed to geocode place: ${place}`, error);
        }
        return {
            latitude: 19.0760,
            longitude: 72.8777,
            timezone: 'Asia/Kolkata',
        };
    }
    async saveKundliToDatabase(userId, dto, kundliData, latitude, longitude, timezone) {
        try {
            const customer = await this.customerRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (!customer) {
                throw new common_1.BadRequestException(`Customer with ID ${userId} not found`);
            }
            const resolvedUserId = customer.id;
            const birthDateTime = new Date(`${dto.birth_date}T${dto.birth_time}`);
            const moonPlanet = kundliData.planets?.find((p) => p.name === 'Moon');
            const moonLongitude = moonPlanet?.longitude;
            const dashaTimeline = this.calculateVimshottariDasha(birthDateTime, kundliData.nakshatra.name, kundliData.nakshatra.lord, moonLongitude);
            const navamsaData = {
                d9_chart: {},
                marriage_strength: '',
            };
            const savedKundli = await this.kundliRepository.create({
                user_id: resolvedUserId,
                birth_date: new Date(dto.birth_date),
                birth_time: dto.birth_time,
                birth_place: dto.birth_place,
                latitude,
                longitude,
                timezone,
                lagna_degrees: kundliData.lagna.degrees,
                lagna_name: kundliData.lagna.sign,
                nakshatra: kundliData.nakshatra.name,
                pada: kundliData.nakshatra.pada,
                tithi: kundliData.tithi,
                yoga: kundliData.yoga,
                karana: kundliData.karana,
                ayanamsa: kundliData.ayanamsa,
                full_data: kundliData.full_data,
                dasha_timeline: dashaTimeline,
                navamsa_data: navamsaData,
            });
            if (kundliData.planets && kundliData.planets.length > 0) {
                const planetsToSave = kundliData.planets.map((planet) => {
                    const planetEntity = this.kundliPlanetRepository.create({
                        kundli_id: savedKundli.id,
                        planet_name: planet.name,
                        longitude_degrees: planet.longitude,
                        sign_number: this.getSignNumber(planet.sign),
                        sign_name: planet.sign,
                        house_number: planet.house || 0,
                        nakshatra: planet.nakshatra || null,
                        pada: planet.nakshatra_pada || null,
                        is_retrograde: planet.is_retrograde || false,
                        speed: null,
                        metadata: {
                            latitude: planet.latitude,
                            sign_lord: planet.sign_lord,
                            nakshatra_lord: planet.nakshatra_lord,
                        },
                    });
                    return planetEntity;
                });
                await this.kundliPlanetRepository.save(planetsToSave);
                this.logger.log(`Saved ${planetsToSave.length} planets for kundli ${savedKundli.id}`);
            }
            if (kundliData.houses && kundliData.houses.length > 0) {
                const housesToSave = kundliData.houses.map((house) => {
                    const houseEntity = this.kundliHouseRepository.create({
                        kundli_id: savedKundli.id,
                        house_number: house.house_number,
                        cusp_degrees: house.start_degree || 0,
                        sign_name: house.sign,
                        sign_number: this.getSignNumber(house.sign),
                        metadata: {
                            sign_lord: house.sign_lord,
                            end_degree: house.end_degree,
                        },
                    });
                    return houseEntity;
                });
                await this.kundliHouseRepository.save(housesToSave);
                this.logger.log(`Saved ${housesToSave.length} houses for kundli ${savedKundli.id}`);
            }
            this.logger.log(`Kundli saved for customer ${resolvedUserId} with all related data`);
        }
        catch (error) {
            this.logger.error(`Failed to save kundli to database for userId ${userId}:`, error);
            throw error;
        }
    }
    getSignNumber(signName) {
        const signs = {
            Aries: 1,
            Taurus: 2,
            Gemini: 3,
            Cancer: 4,
            Leo: 5,
            Virgo: 6,
            Libra: 7,
            Scorpio: 8,
            Sagittarius: 9,
            Capricorn: 10,
            Aquarius: 11,
            Pisces: 12,
        };
        return signs[signName] || 0;
    }
    async generateKundliUpdateJSON(params) {
        try {
            const { user_id, birth_date, birth_time, birth_place, latitude, longitude, timezone } = params;
            const birthDateTime = new Date(`${birth_date}T${birth_time}`);
            const swissData = await this.swissEphemerisService.calculateKundli({
                datetime: birthDateTime,
                latitude,
                longitude,
                timezone: timezone || 'Asia/Kolkata',
                ayanamsa: 1,
            });
            const planetsWithHouses = this.swissEphemerisService.assignPlanetsToHouses(swissData.planets, swissData.houses);
            const moonForDasha = planetsWithHouses.find((p) => p.name === 'Moon');
            const nakshatraName = swissData.nakshatra.name || '';
            const nakshatraPada = swissData.nakshatra.pada || 1;
            const dashaData = this.calculateVimshottariDasha(birthDateTime, nakshatraName, swissData.nakshatra.lord, moonForDasha?.longitude);
            const bhavAnalysis = this.calculateBhavAnalysis(planetsWithHouses, swissData.houses);
            const yogDetails = this.calculateYogDetails(planetsWithHouses, swissData.houses);
            const doshaDetails = this.calculateDoshaDetails(planetsWithHouses, swissData.houses);
            const gocharAnalysis = this.calculateGocharAnalysis(planetsWithHouses);
            const grahaSthiti = {};
            const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
            const planetMap = {
                Sun: 'surya',
                Moon: 'chandra',
                Mars: 'mangal',
                Mercury: 'budh',
                Jupiter: 'guru',
                Venus: 'shukra',
                Saturn: 'shani',
                Rahu: 'rahu',
                Ketu: 'ketu',
            };
            planetsWithHouses.forEach((planet) => {
                const key = planetMap[planet.name] || planet.name.toLowerCase();
                grahaSthiti[key] = {
                    name: planet.name,
                    longitude: planet.longitude,
                    sign: planet.sign,
                    sign_lord: planet.signLord,
                    nakshatra: planet.nakshatra,
                    nakshatra_lord: planet.nakshatraLord,
                    nakshatra_pada: planet.nakshatraPada,
                    house: planet.house,
                    is_retrograde: planet.isRetrograde,
                };
            });
            const lagnaSign = swissData.lagna.sign;
            const lagnaDegrees = swissData.lagna.degrees;
            const moonPlanet = planetsWithHouses.find((p) => p.name === 'Moon');
            const sunPlanet = planetsWithHouses.find((p) => p.name === 'Sun');
            const janmaRashi = moonPlanet?.sign || '';
            const suryaRashi = sunPlanet?.sign || '';
            const moonLongitudeDeg = moonPlanet?.longitude || 0;
            const updateData = {
                birth_date: birth_date,
                birth_time: birth_time,
                birth_place: birth_place,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                timezone: timezone || 'Asia/Kolkata',
                lagna_degrees: lagnaDegrees.toString(),
                lagna_name: lagnaSign,
                nakshatra: nakshatraName,
                pada: nakshatraPada,
                tithi: swissData.tithi || '',
                yoga: swissData.yoga || '',
                karana: swissData.karana || '',
                ayanamsa: swissData.ayanamsa.toString(),
                full_data: {
                    basic_details: {
                        janma_rashi: janmaRashi,
                        surya_rashi: suryaRashi,
                        moon_longitude_deg: moonLongitudeDeg.toString(),
                    },
                    graha_sthiti: grahaSthiti,
                    bhav_analysis: bhavAnalysis,
                    yog_details: yogDetails,
                    dosha_details: doshaDetails,
                    gochar_analysis: gocharAnalysis,
                    health_indicators: {},
                    career_indicators: {},
                    marriage_indicators: {},
                },
                dasha_timeline: dashaData,
                navamsa_data: {
                    d9_chart: {},
                    marriage_strength: '',
                },
                modify_date: new Date().toISOString(),
            };
            return {
                kundli_db_update: {
                    where: {
                        user_id: user_id,
                    },
                    update: updateData,
                },
            };
        }
        catch (error) {
            this.logger.error('Error generating kundli update JSON:', error);
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Failed to generate kundli update JSON');
        }
    }
    calculateVimshottariDasha(birthDate, _nakshatraName, nakshatraLord, moonLongitude, balanceOverride) {
        if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
            this.logger.error('Invalid birth date provided for Vimshottari Dasha calculation');
            throw new common_1.BadRequestException('Invalid birth date');
        }
        const { birthDashaLord, remainingFraction } = this.calculateBirthDashaLord(moonLongitude, nakshatraLord);
        if (!DASHA_SEQUENCE.includes(birthDashaLord)) {
            this.logger.error(`Invalid dasha lord: ${birthDashaLord}, defaulting to Moon`);
            const fallbackLord = 'Moon';
            const fallbackFraction = 1.0;
            return this.calculateVimshottariDasha(birthDate, _nakshatraName, fallbackLord, moonLongitude, balanceOverride);
        }
        const fullMahaYears = PLANET_YEARS[birthDashaLord];
        if (!fullMahaYears || fullMahaYears <= 0) {
            this.logger.error(`Invalid planet years for ${birthDashaLord}`);
            throw new common_1.BadRequestException(`Invalid dasha configuration for ${birthDashaLord}`);
        }
        const balanceYears = this.calculateBalanceYears(balanceOverride, fullMahaYears, remainingFraction);
        this.logger.debug(`Vimshottari Dasha: Birth Mahadasha=${birthDashaLord}, ` +
            `Full Duration=${fullMahaYears} years, ` +
            `Balance=${balanceYears.toFixed(6)} years (${(remainingFraction * 100).toFixed(2)}% remaining)`);
        const birthJD = this.dateToJD(birthDate);
        const birthLordIndex = DASHA_SEQUENCE.indexOf(birthDashaLord);
        if (birthLordIndex === -1) {
            this.logger.error(`Birth dasha lord ${birthDashaLord} not found in sequence`);
            throw new common_1.BadRequestException(`Invalid dasha lord: ${birthDashaLord}`);
        }
        const mahadashaTimeline = this.buildMahadashaTimeline(birthJD, balanceYears, birthLordIndex);
        const detailedTimeline = this.buildDetailedTimeline(mahadashaTimeline, birthJD, balanceYears);
        const nowJD = this.dateToJD(new Date());
        const currentMaha = mahadashaTimeline.find((m) => nowJD >= m.startJD && nowJD < m.endJD) ||
            mahadashaTimeline[0];
        const currentPeriod = this.findCurrentPeriod(detailedTimeline, nowJD);
        return {
            vimshottari: {
                birth_dasha_lord: birthDashaLord,
                balance_years: Number.parseFloat(balanceYears.toFixed(6)),
                balance_days: Math.round(balanceYears * SIDEREAL_YEAR_DAYS),
                mahadasha: mahadashaTimeline.slice(0, 12).map((m) => ({
                    lord: m.lord,
                    start: this.formatJDToDateString(m.startJD),
                    end: this.formatJDToDateString(m.endJD),
                    duration_years: Number.parseFloat(m.durationYears.toFixed(6)),
                    duration_days: Math.round(m.durationYears * SIDEREAL_YEAR_DAYS),
                    is_balance: m.isBalance,
                    is_shadow_planet: m.lord === 'Rahu' || m.lord === 'Ketu',
                })),
                current_mahadasha: currentMaha.lord,
                current_antardasha: currentPeriod?.antardasha || DASHA_SEQUENCE[birthLordIndex],
                current_pratyantar: currentPeriod?.pratyantar || DASHA_SEQUENCE[birthLordIndex],
                detailed_timeline: detailedTimeline.map((period) => {
                    return {
                        mahadasha: period.mahadasha,
                        antardasha: period.antardasha,
                        pratyantar: period.pratyantar,
                        start_date: period.start_date,
                        end_date: period.end_date,
                        duration_years: period.duration_years,
                        duration_days: period.duration_days,
                        ...(period.is_shadow_planet !== undefined && { is_shadow_planet: period.is_shadow_planet }),
                    };
                }),
            },
        };
    }
    dateToJD(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            this.logger.error('Invalid date provided to dateToJD');
            throw new common_1.BadRequestException('Invalid date for Julian Day conversion');
        }
        return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
    }
    jdToDate(jd) {
        if (!Number.isFinite(jd) || jd < 0) {
            this.logger.error(`Invalid Julian Day: ${jd}`);
            throw new common_1.BadRequestException(`Invalid Julian Day: ${jd}`);
        }
        return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
    }
    addYearsToJD(jd, years) {
        if (!Number.isFinite(jd) || !Number.isFinite(years)) {
            this.logger.error(`Invalid parameters for addYearsToJD: jd=${jd}, years=${years}`);
            throw new common_1.BadRequestException('Invalid parameters for date calculation');
        }
        return jd + years * SIDEREAL_YEAR_DAYS;
    }
    formatJDToDateString(jd) {
        const date = this.jdToDate(jd);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    calculateBirthDashaLord(moonLongitude, nakshatraLord) {
        if (moonLongitude !== undefined && moonLongitude >= 0 && moonLongitude <= 360) {
            const normalizedLongitude = moonLongitude === 360 ? 0 : ((moonLongitude % 360) + 360) % 360;
            const nakshatraIndex = Math.floor(normalizedLongitude / NAKSHATRA_SPAN);
            const clampedIndex = Math.min(nakshatraIndex, NAKSHATRA_LORDS.length - 1);
            const birthDashaLord = NAKSHATRA_LORDS[clampedIndex];
            const positionInNakshatra = (normalizedLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
            const remainingFraction = 1 - positionInNakshatra;
            this.logger.debug(`Vimshottari Dasha Calculation: ` +
                `Moon=${normalizedLongitude.toFixed(6)}°, ` +
                `Nakshatra#=${clampedIndex}, ` +
                `Lord=${birthDashaLord}, ` +
                `PositionInNakshatra=${(positionInNakshatra * 100).toFixed(4)}%, ` +
                `Remaining=${(remainingFraction * 100).toFixed(4)}%`);
            return { birthDashaLord, remainingFraction };
        }
        this.logger.warn(`Moon longitude not available (${moonLongitude}), using nakshatra lord fallback: ${nakshatraLord}`);
        const startIndex = DASHA_SEQUENCE.indexOf(nakshatraLord);
        const birthDashaLord = startIndex !== -1 ? nakshatraLord : DASHA_SEQUENCE[3];
        return { birthDashaLord, remainingFraction: 1.0 };
    }
    calculateBalanceYears(balanceOverride, fullMahaYears, remainingFraction) {
        if (!Number.isFinite(fullMahaYears) || fullMahaYears <= 0) {
            this.logger.error(`Invalid fullMahaYears: ${fullMahaYears}`);
            throw new common_1.BadRequestException(`Invalid Mahadasha duration: ${fullMahaYears}`);
        }
        if (!Number.isFinite(remainingFraction) || remainingFraction < 0 || remainingFraction > 1) {
            this.logger.warn(`Invalid remainingFraction: ${remainingFraction}, defaulting to 1.0 (full period)`);
            return fullMahaYears;
        }
        if (balanceOverride !== undefined &&
            Number.isFinite(balanceOverride) &&
            balanceOverride > 0 &&
            balanceOverride <= fullMahaYears) {
            this.logger.debug(`Using balance override: ${balanceOverride} years (instead of calculated ${remainingFraction * fullMahaYears})`);
            return balanceOverride;
        }
        const calculatedBalance = remainingFraction * fullMahaYears;
        if (calculatedBalance <= 0 || calculatedBalance > fullMahaYears) {
            this.logger.warn(`Calculated balance ${calculatedBalance} out of range, using full period`);
            return fullMahaYears;
        }
        return calculatedBalance;
    }
    findCurrentPeriod(timeline, nowJD) {
        return timeline.find(d => {
            const startJD = d.startJD ?? this.dateToJD(new Date(d.start_date + 'T00:00:00'));
            const endJD = d.endJD ?? this.dateToJD(new Date(d.end_date + 'T00:00:00'));
            return nowJD >= startJD && nowJD < endJD;
        });
    }
    buildMahadashaTimeline(birthJD, balanceYears, birthLordIndex) {
        if (!Number.isFinite(birthJD) || birthJD <= 0) {
            this.logger.error(`Invalid birthJD: ${birthJD}`);
            throw new common_1.BadRequestException(`Invalid birth Julian Day: ${birthJD}`);
        }
        if (birthLordIndex < 0 || birthLordIndex >= DASHA_SEQUENCE.length) {
            this.logger.error(`Invalid birthLordIndex: ${birthLordIndex}`);
            throw new common_1.BadRequestException(`Invalid dasha lord index: ${birthLordIndex}`);
        }
        const mahadashas = [];
        let currentJD = birthJD;
        const birthLord = DASHA_SEQUENCE[birthLordIndex];
        const firstMahaEndJD = this.addYearsToJD(currentJD, balanceYears);
        mahadashas.push({
            lord: birthLord,
            startJD: currentJD,
            endJD: firstMahaEndJD,
            durationYears: balanceYears,
            isBalance: true,
        });
        this.logger.debug(`Mahadasha #1 (Balance): ${birthLord} from JD ${currentJD.toFixed(2)} to ${firstMahaEndJD.toFixed(2)} ` +
            `(${balanceYears.toFixed(6)} years)`);
        currentJD = firstMahaEndJD;
        const cyclesToBuild = 2;
        const periodsPerCycle = 9;
        for (let cycle = 0; cycle < cyclesToBuild; cycle++) {
            for (let i = 1; i <= periodsPerCycle; i++) {
                const lordIndex = (birthLordIndex + i) % DASHA_SEQUENCE.length;
                const lord = DASHA_SEQUENCE[lordIndex];
                const duration = PLANET_YEARS[lord];
                if (!duration || duration <= 0) {
                    this.logger.error(`Invalid duration for ${lord}: ${duration}`);
                    continue;
                }
                const endJD = this.addYearsToJD(currentJD, duration);
                const periodNumber = mahadashas.length + 1;
                mahadashas.push({
                    lord,
                    startJD: currentJD,
                    endJD,
                    durationYears: duration,
                    isBalance: false,
                });
                this.logger.debug(`Mahadasha #${periodNumber}: ${lord} from JD ${currentJD.toFixed(2)} to ${endJD.toFixed(2)} ` +
                    `(${duration} years)`);
                currentJD = endJD;
            }
        }
        const totalDuration = mahadashas.reduce((sum, m) => sum + m.durationYears, 0);
        const expectedDuration = balanceYears + TOTAL_CYCLE_YEARS;
        const durationDiff = Math.abs(totalDuration - expectedDuration);
        if (durationDiff > 0.01) {
            this.logger.warn(`Total Mahadasha duration ${totalDuration.toFixed(6)} years differs from expected ` +
                `${expectedDuration.toFixed(6)} years by ${durationDiff.toFixed(6)} years`);
        }
        return mahadashas;
    }
    buildDetailedTimeline(mahadashaTimeline, birthJD, balanceYears) {
        const detailedTimeline = [];
        for (let mahaIdx = 0; mahaIdx < mahadashaTimeline.length; mahaIdx++) {
            const maha = mahadashaTimeline[mahaIdx];
            const mahaLordIndex = DASHA_SEQUENCE.indexOf(maha.lord);
            const fullMahaDuration = PLANET_YEARS[maha.lord];
            if (maha.isBalance) {
                this.addBalanceMahaPeriods(detailedTimeline, maha, mahaLordIndex, balanceYears, fullMahaDuration, birthJD);
            }
            else {
                this.addFullMahaPeriods(detailedTimeline, maha, mahaLordIndex);
            }
        }
        return detailedTimeline;
    }
    addBalanceMahaPeriods(timeline, maha, mahaLordIndex, balanceYears, fullMahaDuration, birthJD) {
        const elapsedYears = fullMahaDuration - balanceYears;
        const { birthAntarIndex, elapsedInAntar } = this.findBirthAntardasha(mahaLordIndex, fullMahaDuration, elapsedYears);
        const { birthPratyantarIndex, elapsedInPratyantar } = this.findBirthPratyantar(mahaLordIndex, birthAntarIndex, fullMahaDuration, elapsedInAntar);
        let currentJD = birthJD;
        for (let a = birthAntarIndex; a < 9; a++) {
            const antarLordIndex = (mahaLordIndex + a) % 9;
            const antarLord = DASHA_SEQUENCE[antarLordIndex];
            const antarDuration = (PLANET_YEARS[antarLord] * fullMahaDuration) / TOTAL_CYCLE_YEARS;
            const antarLordIdxForP = DASHA_SEQUENCE.indexOf(antarLord);
            const startPratyantar = (a === birthAntarIndex) ? birthPratyantarIndex : 0;
            for (let p = startPratyantar; p < 9; p++) {
                const pLordIndex = (antarLordIdxForP + p) % 9;
                const pLord = DASHA_SEQUENCE[pLordIndex];
                let pDuration = (PLANET_YEARS[pLord] * antarDuration) / TOTAL_CYCLE_YEARS;
                if (a === birthAntarIndex && p === birthPratyantarIndex) {
                    pDuration -= elapsedInPratyantar;
                }
                const pEndJD = this.addYearsToJD(currentJD, pDuration);
                timeline.push({
                    mahadasha: maha.lord,
                    antardasha: antarLord,
                    pratyantar: pLord,
                    start_date: this.formatJDToDateString(currentJD),
                    end_date: this.formatJDToDateString(pEndJD),
                    duration_years: Number.parseFloat(pDuration.toFixed(6)),
                    duration_days: Math.round(pDuration * SIDEREAL_YEAR_DAYS),
                    startJD: currentJD,
                    endJD: pEndJD,
                    is_shadow_planet: pLord === 'Rahu' || pLord === 'Ketu' || antarLord === 'Rahu' || antarLord === 'Ketu' || maha.lord === 'Rahu' || maha.lord === 'Ketu',
                });
                currentJD = pEndJD;
            }
        }
    }
    findBirthAntardasha(mahaLordIndex, fullMahaDuration, elapsedYears) {
        if (!Number.isFinite(fullMahaDuration) || fullMahaDuration <= 0) {
            this.logger.error(`Invalid fullMahaDuration: ${fullMahaDuration}`);
            return { birthAntarIndex: 0, elapsedInAntar: 0 };
        }
        if (!Number.isFinite(elapsedYears) || elapsedYears < 0) {
            this.logger.warn(`Invalid elapsedYears: ${elapsedYears}, defaulting to 0`);
            return { birthAntarIndex: 0, elapsedInAntar: 0 };
        }
        const clampedElapsed = Math.min(elapsedYears, fullMahaDuration);
        let cumulativeYears = 0;
        for (let a = 0; a < DASHA_SEQUENCE.length; a++) {
            const antarLordIndex = (mahaLordIndex + a) % DASHA_SEQUENCE.length;
            const antarLord = DASHA_SEQUENCE[antarLordIndex];
            const antarLordYears = PLANET_YEARS[antarLord];
            if (!antarLordYears || antarLordYears <= 0) {
                this.logger.warn(`Invalid years for Antardasha lord ${antarLord}`);
                continue;
            }
            const antarDuration = (antarLordYears * fullMahaDuration) / TOTAL_CYCLE_YEARS;
            if (cumulativeYears + antarDuration > clampedElapsed) {
                const elapsedInAntar = clampedElapsed - cumulativeYears;
                this.logger.debug(`Birth Antardasha: ${antarLord} (index ${a}), ` +
                    `Duration=${antarDuration.toFixed(6)} years, ` +
                    `Elapsed=${elapsedInAntar.toFixed(6)} years`);
                return { birthAntarIndex: a, elapsedInAntar };
            }
            cumulativeYears += antarDuration;
        }
        this.logger.warn(`Could not find birth Antardasha for elapsedYears=${elapsedYears}, ` +
            `fullMahaDuration=${fullMahaDuration}, defaulting to first Antardasha`);
        return { birthAntarIndex: 0, elapsedInAntar: 0 };
    }
    findBirthPratyantar(mahaLordIndex, birthAntarIndex, fullMahaDuration, elapsedInAntar) {
        if (mahaLordIndex < 0 ||
            mahaLordIndex >= DASHA_SEQUENCE.length ||
            birthAntarIndex < 0 ||
            birthAntarIndex >= DASHA_SEQUENCE.length) {
            this.logger.error(`Invalid indices: mahaLordIndex=${mahaLordIndex}, birthAntarIndex=${birthAntarIndex}`);
            return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
        }
        const birthAntarLordIndex = (mahaLordIndex + birthAntarIndex) % DASHA_SEQUENCE.length;
        const birthAntarLord = DASHA_SEQUENCE[birthAntarLordIndex];
        const birthAntarLordYears = PLANET_YEARS[birthAntarLord];
        if (!birthAntarLordYears || birthAntarLordYears <= 0) {
            this.logger.error(`Invalid years for Antardasha lord ${birthAntarLord}`);
            return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
        }
        const birthAntarDuration = (birthAntarLordYears * fullMahaDuration) / TOTAL_CYCLE_YEARS;
        const clampedElapsed = Math.min(elapsedInAntar, birthAntarDuration);
        let pratyantarCumulative = 0;
        for (let p = 0; p < DASHA_SEQUENCE.length; p++) {
            const pLordIndex = (birthAntarLordIndex + p) % DASHA_SEQUENCE.length;
            const pLord = DASHA_SEQUENCE[pLordIndex];
            const pLordYears = PLANET_YEARS[pLord];
            if (!pLordYears || pLordYears <= 0) {
                this.logger.warn(`Invalid years for Pratyantar lord ${pLord}`);
                continue;
            }
            const pDuration = (pLordYears * birthAntarDuration) / TOTAL_CYCLE_YEARS;
            if (pratyantarCumulative + pDuration > clampedElapsed) {
                const elapsedInPratyantar = clampedElapsed - pratyantarCumulative;
                this.logger.debug(`Birth Pratyantar: ${pLord} (index ${p}), ` +
                    `Duration=${pDuration.toFixed(6)} years, ` +
                    `Elapsed=${elapsedInPratyantar.toFixed(6)} years`);
                return { birthPratyantarIndex: p, elapsedInPratyantar };
            }
            pratyantarCumulative += pDuration;
        }
        this.logger.warn(`Could not find birth Pratyantar for elapsedInAntar=${elapsedInAntar}, ` +
            `birthAntarDuration=${birthAntarDuration}, defaulting to first Pratyantar`);
        return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
    }
    addFullMahaPeriods(timeline, maha, mahaLordIndex) {
        let antarCurrentJD = maha.startJD;
        for (let a = 0; a < 9; a++) {
            const antarLordIndex = (mahaLordIndex + a) % 9;
            const antarLord = DASHA_SEQUENCE[antarLordIndex];
            const antarDuration = (PLANET_YEARS[antarLord] * maha.durationYears) / TOTAL_CYCLE_YEARS;
            const antarLordIdxForP = DASHA_SEQUENCE.indexOf(antarLord);
            let pCurrentJD = antarCurrentJD;
            for (let p = 0; p < 9; p++) {
                const pLordIndex = (antarLordIdxForP + p) % 9;
                const pLord = DASHA_SEQUENCE[pLordIndex];
                const pDuration = (PLANET_YEARS[pLord] * antarDuration) / TOTAL_CYCLE_YEARS;
                const pEndJD = this.addYearsToJD(pCurrentJD, pDuration);
                timeline.push({
                    mahadasha: maha.lord,
                    antardasha: antarLord,
                    pratyantar: pLord,
                    start_date: this.formatJDToDateString(pCurrentJD),
                    end_date: this.formatJDToDateString(pEndJD),
                    duration_years: Number.parseFloat(pDuration.toFixed(6)),
                    duration_days: Math.round(pDuration * SIDEREAL_YEAR_DAYS),
                    startJD: pCurrentJD,
                    endJD: pEndJD,
                    is_shadow_planet: pLord === 'Rahu' || pLord === 'Ketu' || antarLord === 'Rahu' || antarLord === 'Ketu' || maha.lord === 'Rahu' || maha.lord === 'Ketu',
                });
                pCurrentJD = pEndJD;
            }
            antarCurrentJD = this.addYearsToJD(antarCurrentJD, antarDuration);
        }
    }
    calculateBhavAnalysis(planets, houses) {
        const bhavAnalysis = {};
        for (let i = 1; i <= 12; i++) {
            const housePlanets = planets.filter((p) => p.house === i);
            const house = houses.find((h) => h.houseNumber === i);
            if (housePlanets.length > 0) {
                const planetNames = housePlanets.map((p) => p.name).join(', ');
                bhavAnalysis[`bhav_${i}`] = `${house?.sign || ''} sign with ${planetNames}`;
            }
            else {
                bhavAnalysis[`bhav_${i}`] = `${house?.sign || ''} sign - empty`;
            }
        }
        return bhavAnalysis;
    }
    calculateYogDetails(planets, houses) {
        const yogs = {
            raj_yog: [],
            dhan_yog: [],
            vipreet_raj_yog: [],
            neecha_bhanga: [],
        };
        const sun = planets.find((p) => p.name === 'Sun');
        const moon = planets.find((p) => p.name === 'Moon');
        const jupiter = planets.find((p) => p.name === 'Jupiter');
        if (jupiter && ([1, 4, 7, 10, 5, 9].includes(jupiter.house))) {
            yogs.raj_yog.push('Jupiter in Kendra/Trikona');
        }
        const dhanHouses = [2, 5, 9, 11];
        const benefics = planets.filter((p) => ['Jupiter', 'Venus', 'Mercury'].includes(p.name));
        benefics.forEach((planet) => {
            if (dhanHouses.includes(planet.house)) {
                yogs.dhan_yog.push(`${planet.name} in ${planet.house}th house`);
            }
        });
        return yogs;
    }
    calculateDoshaDetails(planets, houses) {
        const mars = planets.find((p) => p.name === 'Mars');
        const rahu = planets.find((p) => p.name === 'Rahu');
        const ketu = planets.find((p) => p.name === 'Ketu');
        const jupiter = planets.find((p) => p.name === 'Jupiter');
        const mangalDosha = mars && [1, 4, 7, 8, 12].includes(mars.house);
        let kaalSarpDosha = false;
        if (rahu && ketu) {
            const rahuHouse = rahu.house;
            const ketuHouse = ketu.house;
            const planetsBetween = planets.filter((p) => {
                if (p.name === 'Rahu' || p.name === 'Ketu')
                    return false;
                return p.house >= Math.min(rahuHouse, ketuHouse) && p.house <= Math.max(rahuHouse, ketuHouse);
            });
            kaalSarpDosha = planetsBetween.length === 7;
        }
        const pitruDosha = false;
        const guruChandalDosha = jupiter && rahu && jupiter.house === rahu.house;
        return {
            mangal_dosha: mangalDosha || false,
            kaal_sarp_dosha: kaalSarpDosha,
            pitru_dosha: pitruDosha,
            guru_chandal_dosha: guruChandalDosha || false,
        };
    }
    calculateGocharAnalysis(planets) {
        const saturn = planets.find((p) => p.name === 'Saturn');
        const jupiter = planets.find((p) => p.name === 'Jupiter');
        const rahu = planets.find((p) => p.name === 'Rahu');
        const ketu = planets.find((p) => p.name === 'Ketu');
        return {
            shani_gochar: saturn ? `Saturn in ${saturn.sign} sign, ${saturn.house}th house` : '',
            guru_gochar: jupiter ? `Jupiter in ${jupiter.sign} sign, ${jupiter.house}th house` : '',
            rahu_ketu_gochar: rahu && ketu
                ? `Rahu in ${rahu.sign}, Ketu in ${ketu.sign}`
                : '',
        };
    }
};
exports.KundliService = KundliService;
exports.KundliService = KundliService = KundliService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IKundliRepository')),
    __param(2, (0, typeorm_1.InjectRepository)(kundli_planet_entity_1.KundliPlanet)),
    __param(3, (0, typeorm_1.InjectRepository)(kundli_house_entity_1.KundliHouse)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(6, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [axios_1.HttpService, Object, typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        swiss_ephemeris_service_1.SwissEphemerisService,
        ai_kundli_service_1.AIKundliService,
        config_1.ConfigService])
], KundliService);
//# sourceMappingURL=kundli.service.js.map