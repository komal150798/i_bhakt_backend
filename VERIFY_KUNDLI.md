# Kundli Verification Guide for Rahul Gudadhe

## Birth Details
- **Name:** Rahul Gudadhe
- **Date of Birth:** June 10, 1979
- **Time of Birth:** 12:30 PM (IST)
- **Place:** Nagpur City, Nagpur Urban Taluka, Nagpur, Maharashtra, India
- **Coordinates:** 21.1458° N, 79.0882° E
- **Timezone:** Asia/Kolkata (IST, UTC+5:30)
- **Ayanamsa:** Lahiri (1)

## How to Verify

### Method 1: Using the Verification Script

```bash
cd ib_backend
npx ts-node verify-kundli-rahul.ts
```

This will generate the kundli and display all key parameters for comparison.

### Method 2: Using the API Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/kundli \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Gudadhe",
    "birth_date": "1979-06-10",
    "birth_time": "12:30:00",
    "birth_place": "Nagpur City, Nagpur Urban Taluka, Nagpur, Maharashtra, India",
    "latitude": 21.1458,
    "longitude": 79.0882,
    "timezone": "Asia/Kolkata",
    "ayanamsa": 1
  }'
```

### Method 3: Compare with Jagannatha Hora

1. **Install Jagannatha Hora:**
   - Download from: https://www.vedicastrologer.org/jh/
   - Or use online version if available

2. **Enter Birth Details in Jagannatha Hora:**
   - Date: June 10, 1979
   - Time: 12:30 PM
   - Place: Nagpur, Maharashtra, India
   - Latitude: 21.1458° N
   - Longitude: 79.0882° E
   - Timezone: IST (UTC+5:30)
   - Ayanamsa: Lahiri

3. **Compare Key Parameters:**

   #### Critical Parameters to Verify:
   
   **Lagna (Ascendant):**
   - Sign: Should match exactly
   - Degrees: Should match within 0.1°
   
   **Nakshatra:**
   - Name: Should match exactly
   - Pada: Should match exactly
   - Lord: Should match exactly
   
   **Moon Position:**
   - Longitude: Should match within 0.1°
   - Sign: Should match exactly
   - House: Should match exactly
   
   **Vimshottari Dasha:**
   - Birth Dasha Lord: Should match exactly
   - Balance Years: Should match within 0.01 years
   - Balance Days: Should match within 5 days
   - First Mahadasha start date: Should match exactly
   
   **Planetary Positions:**
   - All planets should match within 0.1° longitude
   - House placements should match exactly
   - Retrograde status should match exactly
   
   **House Cusps:**
   - Should match within 0.1° for each house

## Expected Values (Reference from Jagannatha Hora)

After running Jagannatha Hora, note down these values and compare:

1. **Lagna:** [Sign] [Degrees]°
2. **Nakshatra:** [Name], Pada [1-4], Lord: [Planet]
3. **Birth Dasha:** [Planet], Balance: [Years] years, [Days] days
4. **Moon Longitude:** [Degrees]°
5. **Planetary Positions:** All 9 planets with signs and degrees
6. **House Cusps:** All 12 houses with signs and degrees

## Troubleshooting

If values don't match:

1. **Check Ayanamsa:** Ensure both use Lahiri (1)
2. **Check Coordinates:** Verify latitude/longitude are correct
3. **Check Timezone:** Ensure IST (UTC+5:30) is used
4. **Check Time Format:** Ensure 12:30 PM = 12:30:00 (not 00:30:00)
5. **Check Date:** June 10, 1979 (not June 9 or June 11)

## Notes

- Our system uses Swiss Ephemeris algorithms for calculations
- Vimshottari Dasha uses standard 120-year cycle
- Balance calculation is based on Moon's exact position within nakshatra
- All calculations use sidereal zodiac with Lahiri Ayanamsa



