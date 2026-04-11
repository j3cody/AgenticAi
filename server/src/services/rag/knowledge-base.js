/**
 * Mental Health Knowledge Base
 * Contains educational content for RAG retrieval
 * This simulates a knowledge base that would typically be in a vector database
 */

const knowledgeBase = [
  {
    id: 'kb_001',
    title: 'Understanding Anxiety',
    category: 'anxiety',
    keywords: ['anxiety', 'worried', 'nervous', 'panic', 'fear', 'restless'],
    content: `Anxiety is a natural response to stress and can be helpful in some situations. However, when anxiety becomes excessive or persistent, it can interfere with daily life.

Common symptoms of anxiety include:
- Feeling restless or on edge
- Difficulty concentrating
- Irritability
- Muscle tension
- Sleep disturbances
- Racing thoughts

Coping strategies for anxiety:
1. Deep breathing exercises (4-7-8 technique)
2. Grounding techniques (5-4-3-2-1 method)
3. Regular physical exercise
4. Limiting caffeine and alcohol
5. Practicing mindfulness or meditation
6. Maintaining a regular sleep schedule

When to seek professional help:
- Anxiety interferes with daily activities
- Persistent worry lasts more than 6 months
- Physical symptoms are severe
- You're avoiding situations due to anxiety`,
    tags: ['anxiety', 'coping', 'symptoms', 'professional-help']
  },
  {
    id: 'kb_002',
    title: 'Managing Depression',
    category: 'depression',
    keywords: ['depression', 'sad', 'hopeless', 'unmotivated', 'tired', 'empty'],
    content: `Depression is a common but serious mood disorder. It affects how you feel, think, and handle daily activities.

Signs and symptoms of depression:
- Persistent sad or empty mood
- Loss of interest in activities
- Changes in appetite or weight
- Sleep disturbances
- Fatigue or loss of energy
- Feelings of worthlessness
- Difficulty concentrating
- Thoughts of death or suicide

Self-care strategies:
1. Stay connected with supportive people
2. Engage in activities you used to enjoy
3. Set small, achievable goals
4. Maintain a regular routine
5. Get regular exercise
6. Practice good sleep hygiene

Important: If you're having thoughts of harming yourself, please reach out for help immediately. Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line).`,
    tags: ['depression', 'self-care', 'symptoms', 'crisis']
  },
  {
    id: 'kb_003',
    title: 'Stress Management Techniques',
    category: 'stress',
    keywords: ['stress', 'overwhelmed', 'pressure', 'tension', 'burden', 'exhausted'],
    content: `Stress is the body's response to challenges or demands. While some stress is normal, chronic stress can negatively impact your health and wellbeing.

Common causes of stress:
- Work pressure
- Financial concerns
- Relationship issues
- Health problems
- Major life changes

Effective stress management techniques:

1. Deep Breathing Exercises
   - Breathe in for 4 counts
   - Hold for 7 counts
   - Exhale for 8 counts
   - Repeat 3-4 times

2. Progressive Muscle Relaxation
   - Tense and release muscle groups
   - Start from toes and work up to head
   - Hold tension for 5 seconds, then release

3. Physical Activity
   - Even 10 minutes of movement helps
   - Walking, stretching, or dancing
   - Reduces stress hormones naturally

4. Time Management
   - Prioritize tasks
   - Break large projects into smaller steps
   - Learn to say no

5. Mindfulness Practices
   - Focus on the present moment
   - Notice thoughts without judgment
   - Regular meditation practice`,
    tags: ['stress', 'relaxation', 'techniques', 'mindfulness']
  },
  {
    id: 'kb_004',
    title: 'Building Healthy Relationships',
    category: 'relationships',
    keywords: ['relationship', 'partner', 'friend', 'family', 'communication', 'boundaries'],
    content: `Healthy relationships are essential for mental wellbeing. They provide support, connection, and a sense of belonging.

Characteristics of healthy relationships:
- Mutual respect
- Trust and honesty
- Good communication
- Emotional support
- Independence and autonomy
- Shared decision-making

Improving communication:
1. Practice active listening
2. Use "I" statements
3. Express needs clearly
4. Validate others' feelings
5. Avoid blame and criticism

Setting boundaries:
- Know your limits
- Communicate boundaries clearly
- Respect others' boundaries
- It's okay to say no
- Boundaries protect your wellbeing

When relationships become unhealthy:
- Constant criticism or belittling
- Control or manipulation
- Disrespect of boundaries
- Emotional or physical abuse
- Lack of trust

If you're in an abusive relationship, help is available. Call the National Domestic Violence Hotline: 1-800-799-7233`,
    tags: ['relationships', 'communication', 'boundaries', 'support']
  },
  {
    id: 'kb_005',
    title: 'Sleep and Mental Health',
    category: 'sleep',
    keywords: ['sleep', 'insomnia', 'tired', 'rest', 'awake', 'bedtime'],
    content: `Sleep and mental health are closely connected. Poor sleep can worsen mental health conditions, and mental health issues can affect sleep quality.

The connection between sleep and mental health:
- Sleep helps regulate emotions
- Lack of sleep affects mood and cognition
- Mental health conditions often disrupt sleep
- Good sleep improves treatment outcomes

Tips for better sleep:

1. Maintain a Consistent Schedule
   - Go to bed and wake at the same time
   - Even on weekends
   - Helps regulate your body clock

2. Create a Relaxing Bedtime Routine
   - Dim lights 1 hour before bed
   - Avoid screens
   - Read or practice relaxation

3. Optimize Your Environment
   - Keep bedroom cool and dark
   - Use comfortable bedding
   - Minimize noise

4. Watch What You Consume
   - Avoid caffeine after noon
   - Limit alcohol
   - Don't eat large meals before bed

5. Daytime Habits
   - Get natural sunlight
   - Exercise regularly (not too late)
   - Avoid naps longer than 20 minutes

If sleep problems persist for more than 2 weeks, consider speaking with a healthcare provider.`,
    tags: ['sleep', 'wellness', 'self-care', 'routine']
  },
  {
    id: 'kb_006',
    title: 'Mindfulness and Meditation',
    category: 'mindfulness',
    keywords: ['mindfulness', 'meditation', 'present', 'awareness', 'calm', 'breathing'],
    content: `Mindfulness is the practice of being fully present and engaged in the current moment. It can reduce stress, improve focus, and enhance overall wellbeing.

Benefits of mindfulness:
- Reduced stress and anxiety
- Improved emotional regulation
- Better focus and concentration
- Enhanced self-awareness
- Increased compassion

Simple mindfulness exercises:

1. Mindful Breathing (5 minutes)
   - Sit comfortably
   - Focus on your breath
   - Notice the sensation of breathing
   - When mind wanders, gently return focus

2. Body Scan (10 minutes)
   - Lie down comfortably
   - Focus attention on each body part
   - Start from toes, move to head
   - Notice sensations without judgment

3. 5-4-3-2-1 Grounding Technique
   - Notice 5 things you can see
   - 4 things you can touch
   - 3 things you can hear
   - 2 things you can smell
   - 1 thing you can taste

4. Mindful Walking
   - Walk slowly and deliberately
   - Notice each step
   - Feel the ground beneath you
   - Stay present in the moment

Starting a practice:
- Start small (even 2-3 minutes)
- Be consistent (same time daily)
- Be patient with yourself
- Use guided meditations if helpful`,
    tags: ['mindfulness', 'meditation', 'relaxation', 'techniques']
  },
  {
    id: 'kb_007',
    title: 'Understanding Self-Harm',
    category: 'self-harm',
    keywords: ['self-harm', 'hurt myself', 'cutting', 'injury', 'pain'],
    content: `Self-harm is a way some people cope with intense emotions. It's important to understand that it's a symptom of distress, not attention-seeking behavior.

Why people self-harm:
- To cope with overwhelming emotions
- To feel something when numb
- To express pain they can't put into words
- To feel a sense of control
- To relieve tension

Warning signs:
- Unexplained injuries or scars
- Wearing covering clothes in warm weather
- Spending time alone in private
- Finding sharp objects or other tools

Safer coping alternatives:
1. Hold ice cubes in your hands
2. Snap a rubber band on your wrist
3. Draw on your skin with a marker
4. Exercise vigorously
5. Tear up paper or punch a pillow
6. Take a cold shower

Getting help:
- Talk to someone you trust
- Contact a mental health professional
- Call a helpline: 988 or text HOME to 741741

Important: Self-harm can be a sign of serious emotional distress. Professional support is available and can help you find healthier ways to cope.`,
    tags: ['self-harm', 'coping', 'crisis', 'professional-help']
  },
  {
    id: 'kb_008',
    title: 'Crisis Resources',
    category: 'crisis',
    keywords: ['crisis', 'emergency', 'suicide', 'help', 'hotline', 'immediate'],
    content: `If you're in crisis or having thoughts of harming yourself, please reach out for help immediately. You are not alone.

National Crisis Lines:
- National Suicide Prevention Lifeline: 988 (call or text)
- Crisis Text Line: Text HOME to 741741
- SAMHSA National Helpline: 1-800-662-4357

For specific populations:
- Veterans Crisis Line: 1-800-273-8255, press 1
- LGBTQ+ Trevor Project: 1-866-488-7386
- Trans Lifeline: 1-877-565-8860

What to do in a crisis:
1. Reach out to someone you trust
2. Call a crisis line
3. Go to a safe place
4. Remove access to means of harm
5. Practice grounding techniques
6. Remember that feelings change

If someone you know is in crisis:
- Listen without judgment
- Take them seriously
- Don't leave them alone
- Help them connect with resources
- Encourage professional help

Emergency services: Call 911 if there's immediate danger`,
    tags: ['crisis', 'emergency', 'resources', 'hotlines']
  },
  {
    id: 'kb_009',
    title: 'Building Self-Esteem',
    category: 'self-esteem',
    keywords: ['self-esteem', 'confidence', 'worth', 'value', 'self-worth', 'insecure'],
    content: `Self-esteem is how we perceive and value ourselves. Healthy self-esteem is important for mental wellbeing and healthy relationships.

Signs of low self-esteem:
- Negative self-talk
- Fear of failure
- Difficulty accepting compliments
- People-pleasing behavior
- Comparing yourself to others
- Avoiding new challenges

Building self-esteem:

1. Challenge Negative Thoughts
   - Notice critical self-talk
   - Question the evidence
   - Replace with balanced thoughts

2. Practice Self-Compassion
   - Treat yourself as you would a friend
   - Acknowledge that nobody is perfect
   - Forgive yourself for mistakes

3. Set Achievable Goals
   - Start small
   - Celebrate progress
   - Build on successes

4. Focus on Strengths
   - Make a list of your positive qualities
   - Acknowledge your accomplishments
   - Do things you're good at

5. Surround Yourself with Support
   - Spend time with positive people
   - Limit time with those who bring you down
   - Seek supportive relationships

6. Practice Self-Care
   - Take care of your physical health
   - Do activities you enjoy
   - Set boundaries`,
    tags: ['self-esteem', 'confidence', 'self-worth', 'growth']
  },
  {
    id: 'kb_010',
    title: 'Work-Life Balance',
    category: 'work-life',
    keywords: ['work', 'balance', 'burnout', 'career', 'job', 'overwhelmed', 'rest'],
    content: `Work-life balance is essential for mental health and overall wellbeing. It's about finding harmony between professional and personal life.

Signs of poor work-life balance:
- Working long hours regularly
- Difficulty disconnecting from work
- Neglecting personal relationships
- Feeling constantly stressed
- Physical symptoms like headaches or fatigue
- Loss of enjoyment in activities

Strategies for better balance:

1. Set Clear Boundaries
   - Define work hours
   - Create a dedicated workspace
   - Turn off notifications after hours
   - Learn to say no

2. Prioritize Tasks
   - Use the Eisenhower Matrix
   - Focus on what's important, not just urgent
   - Delegate when possible
   - Break large projects into smaller tasks

3. Make Time for Yourself
   - Schedule personal activities
   - Take regular breaks
   - Use vacation time
   - Protect your time off

4. Practice Self-Care
   - Exercise regularly
   - Get enough sleep
   - Eat well
   - Make time for hobbies

5. Communicate Needs
   - Talk to your manager about workload
   - Ask for flexibility if needed
   - Set realistic expectations

Preventing burnout:
- Recognize early warning signs
- Take breaks before you're exhausted
- Seek support from colleagues
- Consider professional help if needed`,
    tags: ['work-life', 'balance', 'burnout', 'boundaries']
  }
];

module.exports = knowledgeBase;