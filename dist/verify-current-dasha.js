const DASHA_SEQUENCE = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
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
const SIDEREAL_YEAR_DAYS = 365.256363004;
function verifyCurrentDasha() {
    const birthDate = new Date('1979-06-10T12:30:00');
    const currentDate = new Date('2025-01-26T00:00:00');
    const yearsElapsed = (currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * SIDEREAL_YEAR_DAYS);
    console.log('\n=== Current Dasha Verification ===\n');
    console.log(`Birth Date: ${birthDate.toISOString()}`);
    console.log(`Current Date: ${currentDate.toISOString()}`);
    console.log(`Years Elapsed: ${yearsElapsed.toFixed(6)} years\n`);
    const mercuryBalance = 9.51131;
    const ketuPeriod = 7;
    const venusPeriod = 20;
    const sunPeriod = 6;
    const moonPeriod = 10;
    const cumulativeYears = [
        { lord: 'Mercury', start: 0, end: mercuryBalance, cumulative: mercuryBalance },
        { lord: 'Ketu', start: mercuryBalance, end: mercuryBalance + ketuPeriod, cumulative: mercuryBalance + ketuPeriod },
        { lord: 'Venus', start: mercuryBalance + ketuPeriod, end: mercuryBalance + ketuPeriod + venusPeriod, cumulative: mercuryBalance + ketuPeriod + venusPeriod },
        { lord: 'Sun', start: mercuryBalance + ketuPeriod + venusPeriod, end: mercuryBalance + ketuPeriod + venusPeriod + sunPeriod, cumulative: mercuryBalance + ketuPeriod + venusPeriod + sunPeriod },
        { lord: 'Moon', start: mercuryBalance + ketuPeriod + venusPeriod + sunPeriod, end: mercuryBalance + ketuPeriod + venusPeriod + sunPeriod + moonPeriod, cumulative: mercuryBalance + ketuPeriod + venusPeriod + sunPeriod + moonPeriod },
    ];
    let currentMaha = cumulativeYears[0];
    let currentAntar = null;
    let currentPratyantar = null;
    for (const period of cumulativeYears) {
        if (yearsElapsed >= period.start && yearsElapsed < period.end) {
            currentMaha = period;
            break;
        }
    }
    console.log(`Current Mahadasha: ${currentMaha.lord}`);
    console.log(`  Start: ${currentMaha.start.toFixed(6)} years from birth`);
    console.log(`  End: ${currentMaha.end.toFixed(6)} years from birth`);
    console.log(`  Years into Mahadasha: ${(yearsElapsed - currentMaha.start).toFixed(6)} years\n`);
    if (currentMaha.lord === 'Moon') {
        console.log(`✓ Confirmed: We are in Moon Mahadasha\n`);
        const mahaLordIndex = 3;
        const mahaDuration = 10;
        console.log(`Moon Mahadasha Antardasha Calculation:`);
        console.log(`  Moon is at index ${mahaLordIndex} in DASHA_SEQUENCE`);
        console.log(`  Moon Mahadasha duration: ${mahaDuration} years\n`);
        const yearsIntoMoonMaha = yearsElapsed - currentMaha.start;
        let cumulativeAntar = 0;
        for (let a = 0; a < 9; a++) {
            const antarLordIndex = (mahaLordIndex + a) % 9;
            const antarLord = DASHA_SEQUENCE[antarLordIndex];
            const antarLordYears = PLANET_YEARS[antarLord];
            const antarDuration = (antarLordYears * mahaDuration) / TOTAL_CYCLE_YEARS;
            const antarStart = cumulativeAntar;
            const antarEnd = cumulativeAntar + antarDuration;
            if (yearsIntoMoonMaha >= antarStart && yearsIntoMoonMaha < antarEnd) {
                currentAntar = {
                    lord: antarLord,
                    start: antarStart,
                    end: antarEnd,
                    index: a,
                };
            }
            console.log(`  Antardasha ${a + 1}: ${antarLord} (${antarLordYears} years) = ${antarDuration.toFixed(6)} years [${antarStart.toFixed(6)} - ${antarEnd.toFixed(6)}]`);
            cumulativeAntar = antarEnd;
        }
        if (currentAntar) {
            console.log(`\n✓ Current Antardasha: ${currentAntar.lord} (index ${currentAntar.index})`);
            console.log(`  Expected: Jupiter`);
            console.log(`  Match: ${currentAntar.lord === 'Jupiter' ? '✓' : '✗'}\n`);
            const antarLordIndex = DASHA_SEQUENCE.indexOf(currentAntar.lord);
            const antarDuration = (PLANET_YEARS[currentAntar.lord] * mahaDuration) / TOTAL_CYCLE_YEARS;
            const yearsIntoAntar = yearsIntoMoonMaha - currentAntar.start;
            console.log(`Jupiter Antardasha Pratyantar Calculation:`);
            console.log(`  Jupiter is at index ${antarLordIndex} in DASHA_SEQUENCE`);
            console.log(`  Jupiter Antardasha duration: ${antarDuration.toFixed(6)} years`);
            console.log(`  Years into Jupiter Antar: ${yearsIntoAntar.toFixed(6)} years\n`);
            let cumulativePratyantar = 0;
            for (let p = 0; p < 9; p++) {
                const pLordIndex = (antarLordIndex + p) % 9;
                const pLord = DASHA_SEQUENCE[pLordIndex];
                const pLordYears = PLANET_YEARS[pLord];
                const pDuration = (pLordYears * antarDuration) / TOTAL_CYCLE_YEARS;
                const pStart = cumulativePratyantar;
                const pEnd = cumulativePratyantar + pDuration;
                if (yearsIntoAntar >= pStart && yearsIntoAntar < pEnd) {
                    currentPratyantar = {
                        lord: pLord,
                        start: pStart,
                        end: pEnd,
                        index: p,
                    };
                }
                console.log(`  Pratyantar ${p + 1}: ${pLord} (${pLordYears} years) = ${pDuration.toFixed(6)} years [${pStart.toFixed(6)} - ${pEnd.toFixed(6)}]`);
                cumulativePratyantar = pEnd;
            }
            if (currentPratyantar) {
                console.log(`\n✓ Current Pratyantar: ${currentPratyantar.lord} (index ${currentPratyantar.index})`);
                console.log(`  Expected: Rahu`);
                console.log(`  Match: ${currentPratyantar.lord === 'Rahu' ? '✓' : '✗'}\n`);
            }
        }
    }
    else {
        console.log(`✗ Not in Moon Mahadasha - current: ${currentMaha.lord}\n`);
    }
    console.log(`=== Summary ===`);
    console.log(`Current Mahadasha: ${currentMaha.lord} (expected: Moon) ${currentMaha.lord === 'Moon' ? '✓' : '✗'}`);
    if (currentAntar) {
        console.log(`Current Antardasha: ${currentAntar.lord} (expected: Jupiter) ${currentAntar.lord === 'Jupiter' ? '✓' : '✗'}`);
    }
    if (currentPratyantar) {
        console.log(`Current Pratyantar: ${currentPratyantar.lord} (expected: Rahu) ${currentPratyantar.lord === 'Rahu' ? '✓' : '✗'}`);
    }
}
verifyCurrentDasha();
//# sourceMappingURL=verify-current-dasha.js.map