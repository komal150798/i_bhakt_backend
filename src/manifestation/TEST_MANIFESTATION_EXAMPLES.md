# Manifestation Logic Test Cases

## Test Examples for Category Detection

### Career Examples
1. "I want to become a teacher in 2028"
   - Expected: career
   - Keywords: "become", "teacher"
   
2. "I want to get a job as a software engineer"
   - Expected: career
   - Keywords: "get", "job", "software engineer"
   
3. "I want to achieve my career goals and get promoted"
   - Expected: career
   - Keywords: "career", "goals", "promoted"
   
4. "I want to start my own business"
   - Expected: career
   - Keywords: "business"
   
5. "I want to become a doctor"
   - Expected: career
   - Keywords: "become", "doctor"
   
6. "I want to become Chief Minister"
   - Expected: career
   - Keywords: "become", "Chief Minister", "cm"
   
7. "I want to get a position as a manager"
   - Expected: career
   - Keywords: "get", "position", "manager"

### Relationship Examples
8. "I want to find my soulmate"
   - Expected: relationship
   - Keywords: "soulmate"
   
9. "I want to get married"
   - Expected: relationship
   - Keywords: "married", "marriage"
   
10. "I want to find love"
    - Expected: relationship
    - Keywords: "love"
    
11. "I want a happy relationship"
    - Expected: relationship
    - Keywords: "relationship"

### Money/Wealth Examples
12. "I want to earn more money"
    - Expected: money
    - Keywords: "earn", "money"
    
13. "I want to become rich"
    - Expected: money
    - Keywords: "rich"
    
14. "I want financial freedom"
    - Expected: money
    - Keywords: "financial"
    
15. "I want to increase my income"
    - Expected: money
    - Keywords: "income"

### Health Examples
16. "I want to lose weight"
    - Expected: health
    - Keywords: "weight"
    
17. "I want to be healthy"
    - Expected: health
    - Keywords: "healthy", "health"
    
18. "I want to cure my disease"
    - Expected: health
    - Keywords: "cure", "disease"

### Spiritual Examples
19. "I want to find peace"
    - Expected: spiritual
    - Keywords: "peace"
    
20. "I want spiritual growth"
    - Expected: spiritual
    - Keywords: "spiritual"

## Edge Cases
21. "I want to become a teacher and find love" (Mixed - should prioritize based on keywords)
22. "I want success" (Ambiguous - should use context)
23. "I want to achieve my dreams" (Generic - should use fallback)


