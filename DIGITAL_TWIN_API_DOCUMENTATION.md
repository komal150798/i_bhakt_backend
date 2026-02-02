# Digital Twin API Documentation

## Overview

This document describes all Digital Twin APIs created based on the Figma design screens. The APIs provide comprehensive insights into a user's spiritual, emotional, and karmic state.

---

## Base URL

All endpoints are under: `/api/v1/app/twin`

**Authentication:** Required (Bearer Token)

---

## API Endpoints

### 1. Generate Digital Twin (Screen 08 - Profile Completion)

**POST** `/app/twin/generate`

Generates a Digital Twin after profile completion.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "We've created a living reflection of your current alignment.",
    "twin_id": "user-unique-id"
  }
}
```

---

### 2. Upload Avatar Image (Screen 09 - Add Image)

**POST** `/app/twin/avatar`

Upload avatar image for Digital Twin personalization.

**Request:** `multipart/form-data`
- `avatar` (file): Image file

**Response:**
```json
{
  "success": true,
  "data": {
    "avatar_url": "/uploads/avatars/filename.jpg",
    "message": "Avatar uploaded successfully. This image helps personalize your Digital Twin and is not shared publicly."
  }
}
```

**Note:** The image is private and only used for Digital Twin personalization.

---

### 3. Alignment Index (Screen 01)

**GET** `/app/twin/alignment-index`

Get alignment index showing how aligned the user is with their intentions.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "Partially Aligned",
    "score": 65,
    "components": {
      "desire_clarity": "Clear",
      "karma_trend": "Improving",
      "current_time_support": "Favorable"
    },
    "focus_message": "Clarify your intentions and align your actions.",
    "determination_note": "It is a blend of your stated goals, current karma state, and cosmic timing."
  }
}
```

**Status Values:**
- `Fully Aligned` - Score >= 75
- `Partially Aligned` - Score >= 50
- `Misaligned` - Score < 50

---

### 4. Consciousness State (Screen 02)

**GET** `/app/twin/consciousness-state`

Get current consciousness state based on awareness and reflection patterns.

**Response:**
```json
{
  "success": true,
  "data": {
    "state": "Stable",
    "meaning": "You are noticing your thoughts and emotions without getting swept away by them.",
    "influence_factors": [
      "Recent reflections",
      "Emotional patterns",
      "Awareness vs reaction"
    ],
    "action_suggestion": "Notice your thoughts without attachment."
  }
}
```

**State Values:**
- `Stable` - Balanced awareness with reflections
- `Expanding` - Growing awareness, improving karma
- `Contracted` - Declining karma, resistance
- `Unstable` - Fluctuating state

---

### 5. Current Phase (Screen 03)

**GET** `/app/twin/current-phase`

Get current life phase and timing guidance.

**Response:**
```json
{
  "success": true,
  "data": {
    "phase_label": "Expansion Phase",
    "direction": "Favorable ↑",
    "advisory_text": "This is a time for action and expansion. Seize the momentum now.",
    "time_window_note": "Short-term energy window is open. Seize the momentum now."
  }
}
```

**Direction Values:**
- `Favorable ↑` - Positive momentum
- `Neutral →` - Stable period
- `Unfavorable ↓` - Challenging period

---

### 6. Emotional Baseline (Screen 04)

**GET** `/app/twin/emotional-baseline`

Get emotional baseline and stability indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "baseline": "Calm",
    "stability_indicator": [75, 78, 72, 80, 76, 74, 77],
    "insight_text": "Your emotional baseline is the calm undercurrent of your being, regardless of surface fluctuations.",
    "reflection_prompt": "What brings you back to your calm center?"
  }
}
```

**Baseline Values:**
- `Calm` - High positive sentiment
- `Stable` - Moderate positive sentiment
- `Neutral` - Balanced sentiment
- `Anxious` - Low sentiment

**Note:** `stability_indicator` is an array of 7 values representing a week's emotional stability graph.

---

### 7. Energy Level (Screen 05)

**GET** `/app/twin/energy-level`

Get current energy level and suggested approach.

**Response:**
```json
{
  "success": true,
  "data": {
    "level": "Balanced",
    "icon": "⚡",
    "suggested_approach": {
      "act": "Maintain momentum",
      "reflect": "Review your progress",
      "rest": "Maintain balance"
    },
    "influence_text": "Your energy is influenced by mental clarity, emotional state, and physical vitality.",
    "wisdom_prompt": "How can you use this energy wisely?"
  }
}
```

**Level Values:**
- `High` - Energy >= 75
- `Balanced` - Energy >= 50
- `Fluctuating` - Energy >= 30
- `Low` - Energy < 30

---

### 8. Karma State (Screen 06)

**GET** `/app/twin/karma-state`

Get comprehensive karma state with time-based summaries.

**Response:**
```json
{
  "success": true,
  "data": {
    "state": "Positive",
    "trend": "Improving",
    "icon": "⚖️",
    "summary": {
      "today": {
        "good": 3,
        "bad": 1,
        "neutral": 0
      },
      "this_week": {
        "good": 15,
        "bad": 3,
        "neutral": 2
      },
      "this_month": {
        "good": 45,
        "bad": 8,
        "neutral": 5
      }
    },
    "recent_influence": [
      "Journaling",
      "Actions",
      "Rituals"
    ],
    "why_this_state": "Your actions have aligned with your intentions, creating positive momentum.",
    "focus_message": "Focus on mindful actions."
  }
}
```

**State Values:**
- `Positive` - Karma score >= 60
- `Neutral` - Karma score 40-60
- `Negative` - Karma score < 40

**Trend Values:**
- `Improving` - Positive trend
- `Stable` - No significant change
- `Declining` - Negative trend

---

### 9. Manifestation Resonance (Screen 07)

**GET** `/app/twin/manifestation-resonance`

Get active manifestation resonance and cosmic support.

**Response:**
```json
{
  "success": true,
  "data": {
    "active_manifestation": {
      "name": "Career Growth",
      "time_horizon": "Next 6 Months"
    },
    "resonance_state": "Supportive ↑",
    "influence_summary": {
      "karma": "Positive Trend",
      "emotion": "Stable Foundation",
      "timing": "Open Window"
    },
    "guidance_text": "Your current energy is well-aligned. Continue your focused intention with patience."
  }
}
```

**Resonance State Values:**
- `Supportive ↑` - Resonance score > 70
- `Neutral →` - Resonance score 50-70
- `Challenging ↓` - Resonance score < 50

**Note:** If no active manifestation exists, `active_manifestation` will be `null`.

---

### 10. Recent Action Influence (Screen 08)

**GET** `/app/twin/recent-actions`

Get recent actions and their impact on the Digital Twin.

**Response:**
```json
{
  "success": true,
  "data": {
    "last_actions": [
      {
        "action": "Morning Meditation",
        "status": "Completed",
        "impact": "High Impact"
      },
      {
        "action": "Evening Reflections",
        "status": "Completed",
        "impact": "Moderate Impact"
      },
      {
        "action": "Karma Actions",
        "status": "Completed",
        "impact": "High Impact"
      },
      {
        "action": "Gratitude Journaling",
        "status": "Completed",
        "impact": "Moderate Impact"
      }
    ],
    "impact_indicator": "Strengthening ↑",
    "insight_text": "Your consistent positive actions are fortifying your digital twin's alignment with your intentions."
  }
}
```

**Impact Indicator Values:**
- `Strengthening ↑` - Positive actions dominant
- `Stable →` - Balanced actions
- `Weakening ↓` - Negative actions dominant

---

### 11. Today's Reflection (Screen 09)

**GET** `/app/twin/reflection`

Get daily reflection prompt.

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What was my most aligned action today?",
    "type": "daily"
  }
}
```

**Question Types:**
- Rotates daily based on day of week
- Questions include:
  - "What was my most aligned action today?"
  - "How did I show up authentically today?"
  - "What am I grateful for today?"
  - "What did I learn about myself today?"
  - "How did I contribute positively today?"

---

### 12. Twin Evolution (Screen 10)

**GET** `/app/twin/evolution`

Get Digital Twin evolution stage and growth indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "current_stage": "Building",
    "growth_indicators": {
      "consistency": {
        "value": 65,
        "label": "Moderate"
      },
      "awareness": {
        "value": 72,
        "label": "Growing"
      },
      "alignment": {
        "value": 68,
        "label": "Stable"
      }
    },
    "locked_states": [
      "Expanding",
      "Mastering"
    ]
  }
}
```

**Stage Values:**
- `Awakening` - Average score < 40
- `Building` - Average score 40-60
- `Expanding` - Average score 60-80
- `Mastering` - Average score >= 80

**Growth Indicator Labels:**
- Consistency: `Strong` (>=70), `Moderate` (>=50), `Developing` (<50)
- Awareness: `Expanding` (>=70), `Growing` (>=50), `Developing` (<50)
- Alignment: `Improving` (>=70), `Stable` (>=50), `Developing` (<50)

---

### 13. Complete Digital Twin Summary

**GET** `/app/twin/summary`

Get complete Digital Twin summary with all states and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "alignment_index": { ... },
    "consciousness_state": { ... },
    "current_phase": { ... },
    "emotional_baseline": { ... },
    "energy_level": { ... },
    "karma_state": { ... },
    "manifestation_resonance": { ... },
    "recent_actions": { ... },
    "reflection": { ... },
    "evolution": { ... }
  }
}
```

This endpoint returns all the above data in a single response for comprehensive dashboard views.

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## cURL Examples

### Generate Digital Twin
```bash
curl -X POST "http://localhost:3000/api/v1/app/twin/generate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upload Avatar
```bash
curl -X POST "http://localhost:3000/api/v1/app/twin/avatar" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### Get Alignment Index
```bash
curl -X GET "http://localhost:3000/api/v1/app/twin/alignment-index" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Complete Summary
```bash
curl -X GET "http://localhost:3000/api/v1/app/twin/summary" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Implementation Notes

1. **Data Sources:**
   - Karma entries and scores
   - Manifestation logs
   - Journal entries
   - User profile data

2. **Calculations:**
   - All metrics are calculated in real-time based on user's recent activity
   - Scores are normalized to 0-100 scale
   - Trends are calculated by comparing current state with historical data

3. **Performance:**
   - Individual endpoints are optimized for specific use cases
   - Use `/summary` endpoint for dashboard views that need all data
   - Data is calculated on-demand (no caching by default)

4. **Avatar Upload:**
   - Currently saves to local `/uploads/avatars/` directory
   - In production, should upload to S3/cloud storage
   - Image is private and only used for Digital Twin personalization

---

## Screen Mapping

| Screen | Endpoint | Description |
|--------|----------|-------------|
| 08.Profile_screen | POST `/generate` | Generate Digital Twin after profile |
| 09.Profile_screen | POST `/avatar` | Upload avatar image |
| 01.Digital_twin | GET `/alignment-index` | Alignment Index |
| 02.Digital_twin | GET `/consciousness-state` | Consciousness State |
| 03.Digital_twin | GET `/current-phase` | Current Phase |
| 04.Digital_twin | GET `/emotional-baseline` | Emotional Baseline |
| 05.Digital_twin | GET `/energy-level` | Energy Level |
| 06.Digital_twin | GET `/karma-state` | Karma State |
| 07.Digital_twin | GET `/manifestation-resonance` | Manifestation Resonance |
| 08.Digital_twin | GET `/recent-actions` | Recent Action Influence |
| 09.Digital_twin | GET `/reflection` | Today's Reflection |
| 10.Digital_twin | GET `/evolution` | Twin Evolution |
| 10.Digital_twin | GET `/summary` | Complete Summary |

---

## Next Steps

1. **File Upload:** Implement proper file storage (S3/Cloudinary) for avatar images
2. **Caching:** Add Redis caching for frequently accessed data
3. **Real-time Updates:** Use WebSocket for real-time Digital Twin updates
4. **Analytics:** Track which metrics users view most frequently
5. **Personalization:** Customize insights based on user's spiritual path

