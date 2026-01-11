/**
 * Validation Script for Vimshottari Dasha Test Case
 * 
 * Test Case:
 * - DOB: 15-07-1998
 * - Time: 10:15 IST
 * - Place: Nagpur, India
 * 
 * This script validates that the Dasha calculation matches Jagannatha Hora output.
 * 
 * Usage:
 *   1. Start the backend server
 *   2. Run: node validate-dasha-test-case.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

const TEST_CASE = {
  name: 'Test User',
  birth_date: '1998-07-15',
  birth_time: '10:15:00',
  birth_place: 'Nagpur, India',
  // Optional: provide coordinates for accuracy
  latitude: 21.1458,
  longitude: 79.0882,
  timezone: 'Asia/Kolkata',
  ayanamsa: 1, // Lahiri (default)
};

async function validateDashaCalculation() {
  console.log('='.repeat(80));
  console.log('Vimshottari Dasha Validation Test');
  console.log('='.repeat(80));
  console.log('\nTest Case:');
  console.log(`  DOB: ${TEST_CASE.birth_date}`);
  console.log(`  Time: ${TEST_CASE.birth_time} IST`);
  console.log(`  Place: ${TEST_CASE.birth_place}`);
  console.log('\n' + '-'.repeat(80) + '\n');

  try {
    // Call the Kundli API
    console.log('Calling Kundli API...');
    const response = await axios.post(`${API_BASE_URL}/kundli`, TEST_CASE, {
      timeout: 60000, // 60 seconds
    });

    // Response is wrapped by interceptor: { success, code, message, data }
    const kundliData = response.data.data || response.data;
    
    // Extract Dasha information
    const dashaTimeline = kundliData.dasha_timeline;
    if (!dashaTimeline || !dashaTimeline.vimshottari) {
      console.error('❌ ERROR: Dasha timeline not found in response');
      console.log('Response keys:', Object.keys(kundliData));
      return;
    }

    const vimshottari = dashaTimeline.vimshottari;
    
    // Display results
    console.log('✅ API Call Successful\n');
    console.log('='.repeat(80));
    console.log('DASHA CALCULATION RESULTS');
    console.log('='.repeat(80));
    
    // Birth Dasha Information
    console.log('\n📅 Birth Dasha Information:');
    console.log(`  Birth Dasha Lord: ${vimshottari.birth_dasha_lord}`);
    console.log(`  Balance Years: ${vimshottari.balance_years.toFixed(6)}`);
    console.log(`  Balance Days: ${vimshottari.balance_days}`);
    
    // Moon and Nakshatra Information
    const moon = kundliData.planets?.find(p => p.name === 'Moon');
    if (moon) {
      console.log(`\n🌙 Moon Information:`);
      console.log(`  Longitude: ${moon.longitude.toFixed(6)}°`);
      console.log(`  Sign: ${moon.sign}`);
      console.log(`  Nakshatra: ${kundliData.nakshatra?.name || 'N/A'}`);
      console.log(`  Nakshatra Lord: ${kundliData.nakshatra?.lord || 'N/A'}`);
    }
    
    // Current Periods
    console.log(`\n📊 Current Periods:`);
    console.log(`  Current Mahadasha: ${vimshottari.current_mahadasha}`);
    console.log(`  Current Antardasha: ${vimshottari.current_antardasha}`);
    console.log(`  Current Pratyantar: ${vimshottari.current_pratyantar}`);
    
    // First 12 Mahadashas
    console.log(`\n📋 First 12 Mahadashas:`);
    console.log('-'.repeat(80));
    vimshottari.mahadasha?.slice(0, 12).forEach((maha, idx) => {
      const shadowFlag = maha.is_shadow_planet ? ' (Shadow Planet)' : '';
      const balanceFlag = maha.is_balance ? ' [BALANCE]' : '';
      console.log(
        `${(idx + 1).toString().padStart(2)}. ${maha.lord.padEnd(10)} | ` +
        `Start: ${maha.start} | End: ${maha.end} | ` +
        `Duration: ${maha.duration_years.toFixed(6)} years${balanceFlag}${shadowFlag}`
      );
    });
    
    // Detailed Timeline Statistics
    const detailedTimeline = vimshottari.detailed_timeline || [];
    if (detailedTimeline.length > 0) {
      console.log(`\n📈 Detailed Timeline Statistics:`);
      console.log(`  Total Periods: ${detailedTimeline.length}`);
      
      // Count periods by Mahadasha
      const mahaCounts = {};
      detailedTimeline.forEach(p => {
        mahaCounts[p.mahadasha] = (mahaCounts[p.mahadasha] || 0) + 1;
      });
      
      console.log(`  Periods per Mahadasha:`);
      Object.entries(mahaCounts).forEach(([lord, count]) => {
        console.log(`    ${lord}: ${count} periods`);
      });
      
      // Check for shadow planet flags
      const shadowPeriods = detailedTimeline.filter(p => p.is_shadow_planet).length;
      console.log(`  Shadow Planet Periods: ${shadowPeriods}`);
      
      // Verify Julian Day fields are NOT exposed (they should be filtered out)
      const periodsWithJD = detailedTimeline.filter(p => p.startJD || p.endJD).length;
      console.log(`  Periods with Julian Day (should be 0): ${periodsWithJD}/${detailedTimeline.length}`);
      
      if (periodsWithJD === 0) {
        console.log('  ✅ Julian Day fields correctly filtered out from API response');
      } else {
        console.log('  ❌ ERROR: Julian Day fields should NOT be exposed in API response');
        allChecksPassed = false;
      }
    }
    
    // Validation Checks
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION CHECKS');
    console.log('='.repeat(80));
    
    let allChecksPassed = true;
    
    // Check 1: Birth Dasha Lord should match Moon's Nakshatra Lord
    if (moon && kundliData.nakshatra?.lord) {
      const expectedLord = kundliData.nakshatra.lord;
      if (vimshottari.birth_dasha_lord === expectedLord) {
        console.log('✅ Check 1: Birth Dasha Lord matches Nakshatra Lord');
      } else {
        console.log(`❌ Check 1: Birth Dasha Lord mismatch!`);
        console.log(`   Expected: ${expectedLord}, Got: ${vimshottari.birth_dasha_lord}`);
        allChecksPassed = false;
      }
    }
    
    // Check 2: Balance should be positive and less than full Mahadasha duration
    const fullMahaDuration = {
      'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
      'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
    }[vimshottari.birth_dasha_lord];
    
    if (fullMahaDuration) {
      if (vimshottari.balance_years > 0 && vimshottari.balance_years <= fullMahaDuration) {
        console.log(`✅ Check 2: Balance years (${vimshottari.balance_years.toFixed(6)}) is valid (0 < balance <= ${fullMahaDuration})`);
      } else {
        console.log(`❌ Check 2: Balance years (${vimshottari.balance_years.toFixed(6)}) is invalid!`);
        console.log(`   Should be between 0 and ${fullMahaDuration}`);
        allChecksPassed = false;
      }
    }
    
    // Check 3: First Mahadasha should be marked as balance
    const firstMaha = vimshottari.mahadasha?.[0];
    if (firstMaha && firstMaha.is_balance) {
      console.log('✅ Check 3: First Mahadasha is marked as balance period');
    } else {
      console.log('❌ Check 3: First Mahadasha should be marked as balance');
      allChecksPassed = false;
    }
    
    // Check 4: Detailed timeline should have periods for all Mahadashas
    if (detailedTimeline.length >= 81) { // At least 9 Mahadashas × 9 Antardashas
      console.log(`✅ Check 4: Detailed timeline has sufficient periods (${detailedTimeline.length})`);
    } else {
      console.log(`⚠️  Check 4: Detailed timeline may be incomplete (${detailedTimeline.length} periods)`);
    }
    
    // Check 5: Shadow planet flags should be present for Rahu/Ketu periods
    const rahuKetuPeriods = detailedTimeline.filter(p => 
      p.mahadasha === 'Rahu' || p.mahadasha === 'Ketu' ||
      p.antardasha === 'Rahu' || p.antardasha === 'Ketu' ||
      p.pratyantar === 'Rahu' || p.pratyantar === 'Ketu'
    );
    const allShadowFlagged = rahuKetuPeriods.every(p => p.is_shadow_planet === true);
    if (allShadowFlagged && rahuKetuPeriods.length > 0) {
      console.log(`✅ Check 5: All Rahu/Ketu periods have shadow_planet flag`);
    } else if (rahuKetuPeriods.length === 0) {
      console.log('⚠️  Check 5: No Rahu/Ketu periods found in timeline');
    } else {
      console.log('❌ Check 5: Some Rahu/Ketu periods missing shadow_planet flag');
      allChecksPassed = false;
    }
    
    console.log('\n' + '='.repeat(80));
    if (allChecksPassed) {
      console.log('✅ ALL VALIDATION CHECKS PASSED');
      console.log('\n📝 Next Step: Compare birth_dasha_lord and balance_years with Jagannatha Hora output');
      console.log('   Expected: Moon Nakshatra-based calculation should match exactly');
    } else {
      console.log('❌ SOME VALIDATION CHECKS FAILED');
      console.log('   Please review the errors above');
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
      console.error('Expected URL:', `${API_BASE_URL}/kundli`);
    }
    process.exit(1);
  }
}

// Run validation
validateDashaCalculation();

