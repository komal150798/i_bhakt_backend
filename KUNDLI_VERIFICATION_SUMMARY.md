# Kundli Verification Summary for Rahul Gudadhe

## Quick Verification Steps

### 1. Run the Verification Script

```bash
cd ib_backend
npm run verify:kundli
```

This will output all key kundli parameters that you can compare with Jagannatha Hora.

### 2. Key Parameters to Compare

After running the script, compare these values with Jagannatha Hora:

#### ✅ Critical Checks (Must Match Exactly):

1. **Nakshatra Name & Pada**
   - Should match exactly
   - Example: "Rohini", Pada 2

2. **Birth Dasha Lord**
   - Should match exactly
   - Example: "Moon", "Venus", etc.

3. **Lagna Sign**
   - Should match exactly
   - Example: "Leo", "Virgo", etc.

#### ⚠️ Tolerance Checks (Should Match Within Tolerance):

1. **Lagna Degrees**
   - Tolerance: ±0.1°
   - Example: If JH shows 15.23°, ours should be 15.13° to 15.33°

2. **Balance Years**
   - Tolerance: ±0.01 years
   - Example: If JH shows 8.45 years, ours should be 8.44 to 8.46 years

3. **Planetary Longitudes**
   - Tolerance: ±0.1° for most planets
   - Tolerance: ±0.2° for Moon (faster moving)
   - Example: If JH shows Sun at 85.5°, ours should be 85.4° to 85.6°

4. **House Cusps**
   - Tolerance: ±0.1°
   - Example: If JH shows House 1 cusp at 120.5°, ours should be 120.4° to 120.6°

### 3. Common Issues & Solutions

#### Issue: Balance Years Don't Match
**Possible Causes:**
- Different nakshatra calculation
- Moon longitude precision difference
- Different rounding methods

**Solution:**
- Check Moon longitude in both systems
- Verify nakshatra calculation
- Check if balance is calculated from exact position or rounded

#### Issue: Planetary Positions Don't Match
**Possible Causes:**
- Different ephemeris data
- Different ayanamsa calculation
- Timezone conversion issues

**Solution:**
- Verify ayanamsa value matches (should be ~23.85° for 1979)
- Check timezone is IST (UTC+5:30)
- Verify birth time is 12:30 PM, not 00:30 AM

#### Issue: House Cusps Don't Match
**Possible Causes:**
- Different house system (we use Whole Sign or Placidus)
- Different Lagna calculation

**Solution:**
- Verify house system in Jagannatha Hora matches ours
- Check Lagna calculation matches

### 4. Expected Calculation Flow

For **June 10, 1979, 12:30 PM IST, Nagpur**:

1. **Date/Time Conversion:**
   - Local: 1979-06-10 12:30:00 IST
   - UTC: 1979-06-10 07:00:00 UTC (IST = UTC+5:30)
   - Julian Day: ~2444027.29

2. **Ayanamsa (Lahiri for 1979):**
   - Should be approximately 23.85° to 23.86°

3. **Lagna Calculation:**
   - Based on local sidereal time at Nagpur
   - Should be calculated using Swiss Ephemeris algorithms

4. **Moon Position:**
   - Calculated using high-precision lunar algorithms
   - Used to determine nakshatra and dasha

5. **Nakshatra Determination:**
   - Based on Moon's sidereal longitude
   - Each nakshatra = 13°20' (13.333... degrees)

6. **Vimshottari Dasha:**
   - Birth dasha lord = nakshatra lord
   - Balance = remaining portion of nakshatra × dasha duration

### 5. Verification Checklist

- [ ] Lagna sign matches Jagannatha Hora
- [ ] Lagna degrees within ±0.1°
- [ ] Nakshatra name matches exactly
- [ ] Nakshatra pada matches exactly
- [ ] Birth dasha lord matches exactly
- [ ] Balance years within ±0.01 years
- [ ] All planetary positions within ±0.1° (Moon ±0.2°)
- [ ] House cusps within ±0.1°
- [ ] Ayanamsa value matches (Lahiri)
- [ ] Retrograde status matches for all planets

### 6. If Values Don't Match

1. **Check Input Parameters:**
   ```json
   {
     "birth_date": "1979-06-10",
     "birth_time": "12:30:00",  // NOT "00:30:00"
     "latitude": 21.1458,
     "longitude": 79.0882,
     "timezone": "Asia/Kolkata",
     "ayanamsa": 1  // Lahiri
   }
   ```

2. **Verify Time Format:**
   - 12:30 PM = 12:30:00 (noon)
   - NOT 00:30:00 (midnight)

3. **Check Coordinates:**
   - Nagpur: 21.1458° N, 79.0882° E
   - Verify these match in Jagannatha Hora

4. **Review Logs:**
   - Check console output for calculation details
   - Look for warnings or errors

### 7. Manual Calculation Verification

You can manually verify some calculations:

**Nakshatra Index:**
```
nakshatraIndex = floor(MoonLongitude / 13.333...)
dashaLord = DASHA_SEQUENCE[nakshatraIndex % 9]
```

**Balance Calculation:**
```
positionInNakshatra = (MoonLongitude % 13.333...) / 13.333...
remainingFraction = 1 - positionInNakshatra
balanceYears = remainingFraction × dashaDuration
```

### 8. Contact & Support

If discrepancies persist after verification:
1. Document the exact values from both systems
2. Note which parameters match and which don't
3. Check calculation logs for any warnings
4. Verify all input parameters are identical

---

**Note:** Our system uses Swiss Ephemeris algorithms and follows standard Vedic astrology calculations. Minor differences (< 0.1°) are normal due to:
- Different ephemeris data sources
- Rounding methods
- Calculation precision

Significant differences (> 0.5°) should be investigated.





