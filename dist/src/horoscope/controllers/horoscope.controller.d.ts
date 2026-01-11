import { HoroscopeService } from '../services/horoscope.service';
import { GetHoroscopeDto } from '../dto/get-horoscope.dto';
import { HoroscopeResponseDto } from '../dto/horoscope-response.dto';
export declare class HoroscopeController {
    private readonly horoscopeService;
    constructor(horoscopeService: HoroscopeService);
    getHoroscope(dto: GetHoroscopeDto, req: any): Promise<HoroscopeResponseDto>;
    getMyHoroscope(body: {
        type?: 'daily' | 'weekly' | 'monthly';
    }, req: any): Promise<HoroscopeResponseDto>;
}
