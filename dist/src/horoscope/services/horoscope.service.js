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
var HoroscopeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoroscopeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../users/entities/customer.entity");
const swiss_ephemeris_service_1 = require("../../astrology/services/swiss-ephemeris.service");
let HoroscopeService = HoroscopeService_1 = class HoroscopeService {
    constructor(customerRepository, swissEphemerisService) {
        this.customerRepository = customerRepository;
        this.swissEphemerisService = swissEphemerisService;
        this.logger = new common_1.Logger(HoroscopeService_1.name);
        this.zodiacSigns = {
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
    }
    async getHoroscope(dto) {
        try {
            this.logger.log(`Generating horoscope using Swiss Ephemeris for ${dto.sign} (${dto.type})`);
            const horoscopeData = await this.generateHoroscopeWithSwissEphemeris(dto.sign, dto.type);
            return this.transformHoroscopeResponse(horoscopeData, dto);
        }
        catch (error) {
            this.logger.error('Error getting horoscope:', error);
            const fallbackData = this.generateFallbackHoroscope(dto.sign, dto.type);
            this.logger.warn('Swiss Ephemeris failed, using fallback horoscope');
            return this.transformHoroscopeResponse(fallbackData, dto);
        }
    }
    async getHoroscopeForUser(userId, type) {
        try {
            const customer = await this.customerRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (!customer) {
                throw new common_1.NotFoundException('User not found');
            }
            if (!customer.date_of_birth) {
                throw new common_1.BadRequestException('Birth date is required to get personalized horoscope. Please update your profile.');
            }
            const zodiacSign = await this.calculateZodiacSign(customer.date_of_birth, customer.time_of_birth || undefined, customer.latitude ? Number(customer.latitude) : undefined, customer.longitude ? Number(customer.longitude) : undefined);
            const dto = {
                sign: zodiacSign,
                type,
            };
            return this.getHoroscope(dto);
        }
        catch (error) {
            this.logger.error('Error getting personalized horoscope:', error);
            throw new common_1.BadRequestException(error.response?.data?.message || error.message || 'Failed to get personalized horoscope');
        }
    }
    extractDateComponents(birthDate) {
        if (typeof birthDate === 'string') {
            const dateStr = birthDate.split('T')[0];
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                this.logger.debug(`Extracted from string: ${year}-${month}-${day}`);
                return { year, month, day };
            }
        }
        const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
        const localYear = date.getFullYear();
        const localMonth = date.getMonth() + 1;
        const localDay = date.getDate();
        const utcYear = date.getUTCFullYear();
        const utcMonth = date.getUTCMonth() + 1;
        const utcDay = date.getUTCDate();
        this.logger.debug(`Date object - Local: ${localYear}-${localMonth}-${localDay}, UTC: ${utcYear}-${utcMonth}-${utcDay}`);
        return {
            year: localYear,
            month: localMonth,
            day: localDay,
        };
    }
    async calculateZodiacSign(birthDate, birthTime, latitude, longitude) {
        const { month, day, year } = this.extractDateComponents(birthDate);
        this.logger.debug(`Calculating zodiac sign (sidereal Moon sign) for birth date: ${year}-${month}-${day}`);
        if (birthTime && latitude && longitude) {
            try {
                const dateStr = typeof birthDate === 'string' ? birthDate.split('T')[0] : birthDate.toISOString().split('T')[0];
                const datetime = new Date(`${dateStr}T${birthTime}`);
                if (!isNaN(datetime.getTime())) {
                    const kundliData = await this.swissEphemerisService.calculateKundli({
                        datetime,
                        latitude,
                        longitude,
                        timezone: 'Asia/Kolkata',
                    });
                    const moon = kundliData.planets.find((p) => p.name === 'Moon');
                    if (moon && moon.sign) {
                        this.logger.debug(`Moon sign (Sidereal) from Swiss Ephemeris: ${moon.sign}`);
                        return moon.sign;
                    }
                }
            }
            catch (error) {
                this.logger.warn('Swiss Ephemeris calculation failed, falling back to tropical zodiac:', error.message);
            }
        }
        this.logger.debug(`Falling back to tropical zodiac for Month=${month}, Day=${day}`);
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
            return 'Aries';
        }
        else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
            return 'Taurus';
        }
        else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
            return 'Gemini';
        }
        else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
            return 'Cancer';
        }
        else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
            return 'Leo';
        }
        else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
            return 'Virgo';
        }
        else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
            return 'Libra';
        }
        else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
            return 'Scorpio';
        }
        else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
            return 'Sagittarius';
        }
        else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
            return 'Capricorn';
        }
        else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
            return 'Aquarius';
        }
        else {
            return 'Pisces';
        }
    }
    async generateHoroscopeWithSwissEphemeris(sign, type, userLatitude, userLongitude) {
        try {
            const now = new Date();
            const latitude = userLatitude || 20.5937;
            const longitude = userLongitude || 78.9629;
            const kundliData = await this.swissEphemerisService.calculateKundli({
                datetime: now,
                latitude,
                longitude,
                timezone: 'Asia/Kolkata',
            });
            const sun = kundliData.planets.find((p) => p.name === 'Sun');
            const moon = kundliData.planets.find((p) => p.name === 'Moon');
            const mars = kundliData.planets.find((p) => p.name === 'Mars');
            const venus = kundliData.planets.find((p) => p.name === 'Venus');
            const mercury = kundliData.planets.find((p) => p.name === 'Mercury');
            const jupiter = kundliData.planets.find((p) => p.name === 'Jupiter');
            const saturn = kundliData.planets.find((p) => p.name === 'Saturn');
            const signNumber = this.zodiacSigns[sign];
            const signStartDegree = (signNumber - 1) * 30;
            const signEndDegree = signNumber * 30;
            const planetaryInfluences = this.calculatePlanetaryInfluences(sign, sun, moon, mars, venus, mercury, jupiter, saturn, signStartDegree, signEndDegree);
            const predictions = this.generatePredictionsFromPlanets(sign, type, planetaryInfluences, kundliData);
            return {
                sign,
                type,
                date: now.toISOString().split('T')[0],
                prediction: predictions.general,
                love: predictions.love,
                career: predictions.career,
                health: predictions.health,
                finance: predictions.finance,
                lucky_number: this.calculateLuckyNumber(sun, moon, signNumber),
                lucky_color: this.getLuckyColor(sign),
                compatibility: this.getCompatibility(sign),
                mood: this.calculateMoodFromPlanets(moon, venus),
                planetary_influences: planetaryInfluences,
                nakshatra: kundliData.nakshatra,
                tithi: kundliData.tithi,
            };
        }
        catch (error) {
            this.logger.error('Swiss Ephemeris horoscope generation failed:', error);
            throw error;
        }
    }
    calculatePlanetaryInfluences(sign, sun, moon, mars, venus, mercury, jupiter, saturn, signStartDegree, signEndDegree) {
        const influences = {};
        const planets = [sun, moon, mars, venus, mercury, jupiter, saturn].filter(Boolean);
        planets.forEach((planet) => {
            if (!planet)
                return;
            const planetLongitude = planet.longitude;
            const isInSign = planetLongitude >= signStartDegree && planetLongitude < signEndDegree;
            const isRetrograde = planet.isRetrograde;
            influences[planet.name.toLowerCase()] = {
                in_sign: isInSign,
                sign: planet.sign,
                house: planet.house,
                is_retrograde: isRetrograde,
                nakshatra: planet.nakshatra,
                influence: this.getPlanetaryInfluence(planet.name, isInSign, isRetrograde),
            };
        });
        return influences;
    }
    getPlanetaryInfluence(planetName, isInSign, isRetrograde) {
        if (isInSign) {
            return isRetrograde
                ? `${planetName} is retrograde in your sign - time for reflection and review`
                : `${planetName} is strong in your sign - favorable period`;
        }
        return `${planetName} influences other areas of your chart`;
    }
    generatePredictionsFromPlanets(sign, type, influences, kundliData) {
        const sunInfluence = influences.sun?.influence || '';
        const moonInfluence = influences.moon?.influence || '';
        const venusInfluence = influences.venus?.influence || '';
        const marsInfluence = influences.mars?.influence || '';
        const jupiterInfluence = influences.jupiter?.influence || '';
        const general = this.buildGeneralPrediction(sign, type, influences, kundliData);
        const love = this.buildLovePrediction(sign, venusInfluence, moonInfluence, influences);
        const career = this.buildCareerPrediction(sign, sunInfluence, marsInfluence, influences);
        const health = this.buildHealthPrediction(sign, moonInfluence, influences);
        const finance = this.buildFinancePrediction(sign, jupiterInfluence, venusInfluence, influences);
        return { general, love, career, health, finance };
    }
    buildGeneralPrediction(sign, type, influences, kundliData) {
        const period = type === 'daily' ? 'Today' : type === 'weekly' ? 'This week' : 'This month';
        const sunInSign = influences.sun?.in_sign;
        const moonInSign = influences.moon?.in_sign;
        const retrogradePlanets = Object.values(influences).filter((inf) => inf.is_retrograde);
        let prediction = `${period} brings `;
        if (sunInSign) {
            prediction += 'strong solar energy and confidence. ';
        }
        else if (moonInSign) {
            prediction += 'emotional depth and intuition. ';
        }
        else {
            prediction += 'balanced energy and opportunities. ';
        }
        if (retrogradePlanets.length > 0) {
            prediction += `With ${retrogradePlanets.length} planet(s) retrograde, focus on review and reflection. `;
        }
        prediction += `Your ${sign} nature guides you to `;
        prediction += this.getSignGuidance(sign, type);
        return prediction;
    }
    getSignGuidance(sign, type) {
        const guidance = {
            daily: {
                Aries: 'take initiative and lead with confidence.',
                Taurus: 'focus on stability and build on existing foundations.',
                Gemini: 'communicate clearly and explore new ideas.',
                Cancer: 'nurture relationships and trust your intuition.',
                Leo: 'shine brightly and express your creativity.',
                Virgo: 'pay attention to details and organize your tasks.',
                Libra: 'seek balance and harmony in all areas.',
                Scorpio: 'embrace transformation and deep connections.',
                Sagittarius: 'explore new horizons and expand your knowledge.',
                Capricorn: 'work diligently toward your long-term goals.',
                Aquarius: 'think innovatively and connect with your community.',
                Pisces: 'trust your intuition and show compassion.',
            },
            weekly: {
                Aries: 'make strategic moves and assert your leadership.',
                Taurus: 'build lasting foundations and maintain stability.',
                Gemini: 'network effectively and share your knowledge.',
                Cancer: 'deepen emotional bonds and create security.',
                Leo: 'showcase your talents and inspire others.',
                Virgo: 'improve systems and enhance efficiency.',
                Libra: 'foster partnerships and create harmony.',
                Scorpio: 'undergo meaningful transformation and growth.',
                Sagittarius: 'embark on new adventures and learn.',
                Capricorn: 'advance your career and build legacy.',
                Aquarius: 'innovate and contribute to collective goals.',
                Pisces: 'connect with your spiritual side and help others.',
            },
            monthly: {
                Aries: 'establish yourself as a leader and pioneer new paths.',
                Taurus: 'create solid foundations and accumulate resources.',
                Gemini: 'expand your network and share knowledge widely.',
                Cancer: 'build deep emotional connections and security.',
                Leo: 'achieve recognition and express your unique self.',
                Virgo: 'perfect your systems and achieve mastery.',
                Libra: 'form meaningful partnerships and create balance.',
                Scorpio: 'experience profound transformation and renewal.',
                Sagittarius: 'explore new territories and expand horizons.',
                Capricorn: 'achieve significant career milestones.',
                Aquarius: 'contribute to innovation and social progress.',
                Pisces: 'deepen spiritual connections and serve others.',
            },
        };
        return guidance[type]?.[sign] || 'follow your inner wisdom and stay true to yourself.';
    }
    buildLovePrediction(sign, venusInfluence, moonInfluence, influences) {
        const venusInSign = influences.venus?.in_sign;
        const moonInSign = influences.moon?.in_sign;
        if (venusInSign) {
            return `Venus brings romance and harmony to relationships. ${this.getLovePrediction(sign)}`;
        }
        else if (moonInSign) {
            return `Emotional connections deepen. ${this.getLovePrediction(sign)}`;
        }
        return this.getLovePrediction(sign);
    }
    buildCareerPrediction(sign, sunInfluence, marsInfluence, influences) {
        const sunInSign = influences.sun?.in_sign;
        const marsInSign = influences.mars?.in_sign;
        if (sunInSign) {
            return `Solar energy boosts career confidence. ${this.getCareerPrediction(sign)}`;
        }
        else if (marsInSign) {
            return `Mars drives ambition and action. ${this.getCareerPrediction(sign)}`;
        }
        return this.getCareerPrediction(sign);
    }
    buildHealthPrediction(sign, moonInfluence, influences) {
        const moonInSign = influences.moon?.in_sign;
        if (moonInSign) {
            return 'Emotional well-being supports physical health. Maintain balance and listen to your body.';
        }
        return this.getHealthPrediction(sign);
    }
    buildFinancePrediction(sign, jupiterInfluence, venusInfluence, influences) {
        const jupiterInSign = influences.jupiter?.in_sign;
        const venusInSign = influences.venus?.in_sign;
        if (jupiterInSign) {
            return 'Jupiter brings expansion and opportunities. Make wise investments and plan for growth.';
        }
        else if (venusInSign) {
            return 'Venus supports financial harmony. Balance spending and saving wisely.';
        }
        return this.getFinancePrediction(sign);
    }
    calculateLuckyNumber(sun, moon, signNumber) {
        if (!sun || !moon)
            return Math.floor(Math.random() * 100).toString();
        const sunDegree = Math.floor(sun.longitude % 30);
        const moonDegree = Math.floor(moon.longitude % 30);
        const luckyNum = ((sunDegree + moonDegree + signNumber) % 100) + 1;
        return luckyNum.toString();
    }
    calculateMoodFromPlanets(moon, venus) {
        if (!moon)
            return 'Balanced';
        const moonSign = moon.sign;
        const isVenusStrong = venus && (venus.sign === moonSign || venus.house === 1);
        if (isVenusStrong) {
            return 'Harmonious';
        }
        const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
        const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
        const airSigns = ['Gemini', 'Libra', 'Aquarius'];
        const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
        if (fireSigns.includes(moonSign))
            return 'Energetic';
        if (earthSigns.includes(moonSign))
            return 'Grounded';
        if (airSigns.includes(moonSign))
            return 'Thoughtful';
        if (waterSigns.includes(moonSign))
            return 'Intuitive';
        return 'Balanced';
    }
    generateFallbackHoroscope(sign, type) {
        const predictions = this.getPredictionsByType(type);
        const randomPrediction = predictions[Math.floor(Math.random() * predictions.length)];
        return {
            sign,
            type,
            date: new Date().toISOString().split('T')[0],
            prediction: randomPrediction,
            love: this.getLovePrediction(sign),
            career: this.getCareerPrediction(sign),
            health: this.getHealthPrediction(sign),
            finance: this.getFinancePrediction(sign),
            lucky_number: Math.floor(Math.random() * 100).toString(),
            lucky_color: this.getLuckyColor(sign),
            compatibility: this.getCompatibility(sign),
            mood: this.getMood(sign),
        };
    }
    transformHoroscopeResponse(apiData, dto) {
        const data = apiData.data || apiData;
        return {
            sign: dto.sign,
            type: dto.type,
            date: data.date || new Date().toISOString().split('T')[0],
            prediction: data.prediction || data.horoscope || data.description || '',
            love: data.love || data.romance || '',
            career: data.career || data.professional || '',
            health: data.health || '',
            finance: data.finance || data.money || '',
            lucky_number: data.lucky_number || data.luckyNumber || '',
            lucky_color: data.lucky_color || data.luckyColor || '',
            compatibility: data.compatibility || '',
            mood: data.mood || '',
            full_data: data,
        };
    }
    getPredictionsByType(type) {
        if (type === 'daily') {
            return [
                'Today brings new opportunities for growth and success. Trust your instincts and take calculated risks.',
                'A day of reflection and planning. Focus on your goals and make steady progress.',
                'Positive energy surrounds you today. Embrace change and be open to new experiences.',
                'Communication is key today. Express your thoughts clearly and listen to others.',
                'A balanced day ahead. Maintain harmony in your relationships and work.',
            ];
        }
        else if (type === 'weekly') {
            return [
                'This week brings significant changes. Stay adaptable and maintain a positive mindset.',
                'A week of growth and learning. Focus on personal development and new skills.',
                'Relationships take center stage this week. Nurture connections and communicate openly.',
                'Financial opportunities may arise. Make wise decisions and plan for the future.',
                'Health and wellness should be a priority. Take care of your physical and mental well-being.',
            ];
        }
        else {
            return [
                'This month marks a period of transformation. Embrace change and trust the journey ahead.',
                'A month of opportunities and growth. Stay focused on your long-term goals.',
                'Relationships and partnerships flourish this month. Invest time in meaningful connections.',
                'Financial stability and growth are possible. Make strategic decisions and save wisely.',
                'Health and wellness improvements are on the horizon. Prioritize self-care and balance.',
            ];
        }
    }
    getLovePrediction(sign) {
        const predictions = {
            Aries: 'Passion and excitement in relationships. Express your feelings openly.',
            Taurus: 'Stability and comfort in love. Focus on building deeper connections.',
            Gemini: 'Communication is key. Share your thoughts and listen to your partner.',
            Cancer: 'Emotional depth and nurturing relationships. Show care and affection.',
            Leo: 'Romance and grand gestures. Make your loved ones feel special.',
            Virgo: 'Practical love and attention to details. Small gestures matter most.',
            Libra: 'Harmony and balance in relationships. Seek compromise and understanding.',
            Scorpio: 'Intense and transformative love. Deep connections are possible.',
            Sagittarius: 'Adventure and freedom in love. Explore new experiences together.',
            Capricorn: 'Commitment and long-term planning. Build a solid foundation.',
            Aquarius: 'Unconventional and unique love. Embrace your individuality.',
            Pisces: 'Compassionate and intuitive love. Trust your feelings and emotions.',
        };
        return predictions[sign] || 'Love and relationships bring joy and fulfillment.';
    }
    getCareerPrediction(sign) {
        const predictions = {
            Aries: 'Leadership opportunities arise. Take initiative and show confidence.',
            Taurus: 'Steady progress in career. Focus on long-term stability and growth.',
            Gemini: 'Networking and communication skills shine. Build professional relationships.',
            Cancer: 'Emotional intelligence helps in career. Trust your intuition.',
            Leo: 'Recognition and appreciation at work. Your efforts are noticed.',
            Virgo: 'Attention to detail pays off. Focus on quality and precision.',
            Libra: 'Collaboration and teamwork lead to success. Balance work relationships.',
            Scorpio: 'Transformation and growth in career. Embrace change and challenges.',
            Sagittarius: 'New opportunities and expansion. Explore different paths.',
            Capricorn: 'Hard work and dedication bring rewards. Stay focused on goals.',
            Aquarius: 'Innovation and creativity in work. Think outside the box.',
            Pisces: 'Intuition guides career decisions. Trust your inner wisdom.',
        };
        return predictions[sign] || 'Career opportunities and professional growth are on the horizon.';
    }
    getHealthPrediction(sign) {
        return 'Maintain a balanced lifestyle. Regular exercise, proper nutrition, and adequate rest are essential for your well-being.';
    }
    getFinancePrediction(sign) {
        return 'Financial stability is possible with careful planning. Avoid impulsive spending and focus on long-term investments.';
    }
    getLuckyColor(sign) {
        const colors = {
            Aries: 'Red',
            Taurus: 'Green',
            Gemini: 'Yellow',
            Cancer: 'Silver',
            Leo: 'Gold',
            Virgo: 'Brown',
            Libra: 'Pink',
            Scorpio: 'Maroon',
            Sagittarius: 'Purple',
            Capricorn: 'Black',
            Aquarius: 'Blue',
            Pisces: 'Sea Green',
        };
        return colors[sign] || 'White';
    }
    getCompatibility(sign) {
        const compatibilities = {
            Aries: 'Best with Leo, Sagittarius',
            Taurus: 'Best with Virgo, Capricorn',
            Gemini: 'Best with Libra, Aquarius',
            Cancer: 'Best with Scorpio, Pisces',
            Leo: 'Best with Aries, Sagittarius',
            Virgo: 'Best with Taurus, Capricorn',
            Libra: 'Best with Gemini, Aquarius',
            Scorpio: 'Best with Cancer, Pisces',
            Sagittarius: 'Best with Aries, Leo',
            Capricorn: 'Best with Taurus, Virgo',
            Aquarius: 'Best with Gemini, Libra',
            Pisces: 'Best with Cancer, Scorpio',
        };
        return compatibilities[sign] || 'Compatible with all signs';
    }
    getMood(sign) {
        const moods = ['Optimistic', 'Calm', 'Energetic', 'Reflective', 'Confident', 'Balanced'];
        return moods[Math.floor(Math.random() * moods.length)];
    }
};
exports.HoroscopeService = HoroscopeService;
exports.HoroscopeService = HoroscopeService = HoroscopeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        swiss_ephemeris_service_1.SwissEphemerisService])
], HoroscopeService);
//# sourceMappingURL=horoscope.service.js.map