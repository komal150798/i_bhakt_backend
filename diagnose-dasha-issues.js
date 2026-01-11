/**
 * Diagnostic Script for Vimshottari Dasha Issues
 * 
 * This script helps identify what might be wrong with the Dasha response.
 * 
 * Usage:
 *   1. Start the backend server
 *   2. Run: node diagnose-dasha-issues.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

const TEST_CASE = {
  name: 'Test User',
  birth_date: '1998-07-15',
  birth_time: '10:15:00',
  birth_place: 'Nagpur, India',
  latitude: 21.1458,
  longitude: 79.0882,
  timezone: 'Asia/Kolkata',
  ayanamsa: 1,
};

async function diagnoseIssues() {
  console.log('='.repeat(80));
  console.log('Vimshottari Dasha Diagnostic Tool');
  console.log('='.repeat(80));
  console.log('\nTest Case:');
  console.log(`  DOB: ${TEST_CASE.birth_date}`);
  console.log(`  Time: ${TEST_CASE.birth_time} IST`);
  console.log(`  Place: ${TEST_CASE.birth_place}`);
  console.log('\n' + '-'.repeat(80) + '\n');

  try {
    console.log('Calling Kundli API...');
    const response = await axios.post(`${API_BASE_URL}/kundli`, TEST_CASE, {
      timeout: 60000,
    });

    // Response is wrapped by interceptor: { success, code, message, data }
    const kundliData = response.data.data || response.data;
    
    console.log('\n✅ API Call Successful\n');
    console.log('='.repeat(80));
    console.log('RESPONSE STRUCTURE ANALYSIS');
    console.log('='.repeat(80));
    
    // Check top-level structure
    console.log('\n📋 Top-level keys:', Object.keys(kundliData));
    
    // Check if dasha_timeline exists
    if (!kundliData.dasha_timeline) {
      console.log('\n❌ ISSUE FOUND: dasha_timeline is missing!');
      console.log('   This means the Dasha calculation may have failed or returned null.');
      return;
    }
    
    console.log('\n✅ dasha_timeline exists');
    console.log('   Type:', typeof kundliData.dasha_timeline);
    console.log('   Value:', kundliData.dasha_timeline === null ? 'null' : 'object');
    
    if (kundliData.dasha_timeline === null) {
      console.log('\n❌ ISSUE FOUND: dasha_timeline is null!');
      console.log('   The Dasha calculation returned null. Check server logs for errors.');
      return;
    }
    
    // Check vimshottari
    if (!kundliData.dasha_timeline.vimshottari) {
      console.log('\n❌ ISSUE FOUND: dasha_timeline.vimshottari is missing!');
      console.log('   dasha_timeline keys:', Object.keys(kundliData.dasha_timeline));
      return;
    }
    
    console.log('\n✅ vimshottari exists');
    const vimshottari = kundliData.dasha_timeline.vimshottari;
    console.log('   vimshottari keys:', Object.keys(vimshottari));
    
    // Check required fields
    const requiredFields = ['birth_dasha_lord', 'balance_years', 'balance_days', 'mahadasha', 'current_mahadasha'];
    const missingFields = requiredFields.filter(field => !(field in vimshottari));
    
    if (missingFields.length > 0) {
      console.log('\n❌ ISSUE FOUND: Missing required fields in vimshottari:');
      missingFields.forEach(field => console.log(`   - ${field}`));
    } else {
      console.log('\n✅ All required fields present in vimshottari');
    }
    
    // Display birth Dasha info
    if (vimshottari.birth_dasha_lord) {
      console.log('\n📅 Birth Dasha Information:');
      console.log(`   Birth Dasha Lord: ${vimshottari.birth_dasha_lord}`);
      console.log(`   Balance Years: ${vimshottari.balance_years}`);
      console.log(`   Balance Days: ${vimshottari.balance_days}`);
    }
    
    // Check Moon and Nakshatra
    const moon = kundliData.planets?.find(p => p.name === 'Moon');
    if (moon) {
      console.log('\n🌙 Moon Information:');
      console.log(`   Longitude: ${moon.longitude}°`);
      console.log(`   Sign: ${moon.sign}`);
      console.log(`   Nakshatra: ${kundliData.nakshatra?.name || 'N/A'}`);
      console.log(`   Nakshatra Lord: ${kundliData.nakshatra?.lord || 'N/A'}`);
      
      // Verify birth Dasha lord matches nakshatra lord
      if (vimshottari.birth_dasha_lord && kundliData.nakshatra?.lord) {
        if (vimshottari.birth_dasha_lord === kundliData.nakshatra.lord) {
          console.log('   ✅ Birth Dasha Lord matches Nakshatra Lord');
        } else {
          console.log(`   ⚠️  MISMATCH: Birth Dasha Lord (${vimshottari.birth_dasha_lord}) != Nakshatra Lord (${kundliData.nakshatra.lord})`);
          console.log('      This might indicate a calculation issue.');
        }
      }
    } else {
      console.log('\n⚠️  Moon planet data not found in response');
    }
    
    // Check Mahadasha array
    if (vimshottari.mahadasha) {
      console.log(`\n📋 Mahadasha Array: ${vimshottari.mahadasha.length} entries`);
      if (vimshottari.mahadasha.length > 0) {
        const firstMaha = vimshottari.mahadasha[0];
        console.log('   First Mahadasha keys:', Object.keys(firstMaha));
        console.log('   First Mahadasha:', JSON.stringify(firstMaha, null, 2));
        
        // Check if first is balance
        if (firstMaha.is_balance) {
          console.log('   ✅ First Mahadasha is marked as balance');
        } else {
          console.log('   ⚠️  First Mahadasha is NOT marked as balance (expected for birth period)');
        }
      }
    } else {
      console.log('\n❌ ISSUE FOUND: mahadasha array is missing!');
    }
    
    // Check detailed timeline
    if (vimshottari.detailed_timeline) {
      console.log(`\n📈 Detailed Timeline: ${vimshottari.detailed_timeline.length} periods`);
      
      if (vimshottari.detailed_timeline.length === 0) {
        console.log('   ⚠️  WARNING: Detailed timeline is empty!');
      } else {
        const firstPeriod = vimshottari.detailed_timeline[0];
        console.log('   First Period keys:', Object.keys(firstPeriod));
        console.log('   First Period sample:', JSON.stringify(firstPeriod, null, 2));
        
        // Check for Julian Day fields
        const periodsWithJD = vimshottari.detailed_timeline.filter(p => p.startJD && p.endJD).length;
        console.log(`   Periods with Julian Day: ${periodsWithJD}/${vimshottari.detailed_timeline.length}`);
        
        // Check for shadow planet flags
        const shadowPeriods = vimshottari.detailed_timeline.filter(p => p.is_shadow_planet).length;
        console.log(`   Shadow Planet Periods: ${shadowPeriods}`);
      }
    } else {
      console.log('\n❌ ISSUE FOUND: detailed_timeline is missing!');
    }
    
    // Check current periods
    console.log('\n📊 Current Periods:');
    console.log(`   Current Mahadasha: ${vimshottari.current_mahadasha || 'N/A'}`);
    console.log(`   Current Antardasha: ${vimshottari.current_antardasha || 'N/A'}`);
    console.log(`   Current Pratyantar: ${vimshottari.current_pratyantar || 'N/A'}`);
    
    // Full response dump (for debugging)
    console.log('\n' + '='.repeat(80));
    console.log('FULL RESPONSE (dasha_timeline only):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(kundliData.dasha_timeline, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
      console.error('Expected URL:', `${API_BASE_URL}/kundli`);
    } else {
      console.error('Error details:', error);
    }
    process.exit(1);
  }
}

// Run diagnostic
diagnoseIssues();

