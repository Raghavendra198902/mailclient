'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, X, Paperclip, Image as ImageIcon, Smile, AtSign,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Trash2, Save, Eye,
  ChevronDown, CheckCircle, AlertCircle, Sparkles, ArrowLeft,
  Clock, Users, Type, Palette
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

interface EmailDraft {
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  attachments: Attachment[]
}

export default function ComposePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [draft, setDraft] = useState<EmailDraft>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: []
  })
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [savedDrafts, setSavedDrafts] = useState<EmailDraft[]>([])
  const [showFormatting, setShowFormatting] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'friendly' | 'formal'>('professional')
  const [aiFeatures, setAiFeatures] = useState({
    smartCompose: false,
    grammarCheck: true,
    toneAnalysis: true,
    autoComplete: true
  })
  const [grammarSuggestions, setGrammarSuggestions] = useState<string[]>([])
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [sentiment, setSentiment] = useState<{ score: number, label: string, color: string }>({ score: 0, label: 'Neutral', color: 'gray' })
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null)
  const [versionHistory, setVersionHistory] = useState<Array<{ timestamp: string, content: string, subject: string }>>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [readabilityScore, setReadabilityScore] = useState<{ score: number, grade: string, complexity: string }>({
    score: 0,
    grade: 'N/A',
    complexity: 'Simple'
  })
  const [smartContacts, setSmartContacts] = useState<string[]>([])
  const [showContactSuggestions, setShowContactSuggestions] = useState(false)
  const [emailTemplateCategory, setEmailTemplateCategory] = useState<'business' | 'personal' | 'support' | 'sales'>('business')
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [showInsights, setShowInsights] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load saved drafts from localStorage
    const drafts = localStorage.getItem('emailDrafts')
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts))
    }
  }, [router])

  const handleInputChange = (field: keyof EmailDraft, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: Attachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }))
    
    setDraft(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }))
  }

  const removeAttachment = (id: string) => {
    setDraft(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const saveDraft = () => {
    const drafts = [...savedDrafts, { ...draft, timestamp: new Date().toISOString() }]
    setSavedDrafts(drafts)
    localStorage.setItem('emailDrafts', JSON.stringify(drafts))
    setMessage({ type: 'success', text: 'Draft saved successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const applyFormatting = (format: string) => {
    const textarea = bodyRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    let formattedText = selectedText
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `__${selectedText}__`
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) formattedText = `[${selectedText}](${url})`
        break
    }

    const newBody = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end)
    handleInputChange('body', newBody)
  }

  const getAISuggestion = async () => {
    setShowAIAssist(true)
    setAiSuggestion('Analyzing your email...')
    
    // Simulate AI processing
    setTimeout(() => {
      const context = `${draft.subject} ${draft.body}`.toLowerCase()
      let suggestions = []
      
      // Context-aware suggestions
      if (!draft.subject) {
        suggestions.push('💡 Add a clear subject line to improve open rates by 50%')
      }
      if (draft.body.length < 50) {
        suggestions.push('📝 Consider adding more detail to your message')
      }
      if (context.includes('meeting') && !context.includes('time')) {
        suggestions.push('⏰ Include specific meeting time and timezone')
      }
      if (context.includes('attach') && draft.attachments.length === 0) {
        suggestions.push('📎 You mentioned attachment but haven\'t added any files')
      }
      if (!context.includes('regards') && !context.includes('thanks') && !context.includes('sincerely')) {
        suggestions.push('✅ Add a professional closing like "Best regards" or "Thank you"')
      }
      
      // Tone analysis
      const toneMap = {
        professional: 'Your tone is professional and suitable for business communication',
        casual: 'Your tone is casual and friendly - great for informal conversations',
        friendly: 'Your tone is warm and friendly - perfect for relationship building',
        formal: 'Your tone is formal - appropriate for official communications'
      }
      
      if (suggestions.length === 0) {
        suggestions.push('✨ Your email looks great! ' + toneMap[selectedTone])
      }
      
      setAiSuggestion(suggestions[0])
    }, 1500)
  }

  const generateAIContent = async (prompt: string) => {
    setIsAIGenerating(true)
    
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const templates = {
        professional: `Dear ${draft.to.split('@')[0] || 'Recipient'},\n\nI hope this email finds you well. I am writing to discuss ${draft.subject || 'an important matter'}.\n\n${prompt}\n\nI look forward to your response at your earliest convenience.\n\nBest regards,\n${user?.full_name || 'Your Name'}`,
        casual: `Hi ${draft.to.split('@')[0] || 'there'},\n\nHope you're doing great! Just wanted to reach out about ${draft.subject || 'something'}.\n\n${prompt}\n\nLet me know what you think!\n\nCheers,\n${user?.full_name || 'Your Name'}`,
        friendly: `Hello ${draft.to.split('@')[0] || 'friend'},\n\nI hope this message finds you well! I wanted to share some thoughts about ${draft.subject || 'our discussion'}.\n\n${prompt}\n\nLooking forward to hearing from you soon!\n\nWarm regards,\n${user?.full_name || 'Your Name'}`,
        formal: `Dear Sir/Madam,\n\nRe: ${draft.subject || 'Formal Communication'}\n\nI am writing to formally address ${prompt}\n\nI appreciate your attention to this matter and await your response.\n\nYours sincerely,\n${user?.full_name || 'Your Name'}`
      }
      
      const generatedContent = templates[selectedTone] || templates.professional
      handleInputChange('body', generatedContent)
      setMessage({ type: 'success', text: 'AI content generated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate AI content' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsAIGenerating(false)
    }
  }

  const improveWithAI = async () => {
    if (!draft.body) {
      setMessage({ type: 'error', text: 'Please write some content first' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    setIsAIGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simple improvements
      let improved = draft.body
      
      // Capitalize first letter
      improved = improved.charAt(0).toUpperCase() + improved.slice(1)
      
      // Add punctuation if missing
      if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
        improved += '.'
      }
      
      // Add spacing after periods
      improved = improved.replace(/\.([A-Z])/g, '. $1')
      
      // Remove multiple spaces
      improved = improved.replace(/  +/g, ' ')
      
      handleInputChange('body', improved)
      setMessage({ type: 'success', text: 'Email improved with AI!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to improve content' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsAIGenerating(false)
    }
  }

  const checkGrammar = async () => {
    if (!draft.body) return
    
    // Simple grammar checks
    const suggestions = []
    const text = draft.body.toLowerCase()
    
    if (text.includes('your welcome')) {
      suggestions.push('Did you mean "you\'re welcome" instead of "your welcome"?')
    }
    if (text.includes('alot')) {
      suggestions.push('"Alot" should be "a lot" (two words)')
    }
    if (text.includes('recieve')) {
      suggestions.push('"Recieve" should be spelled "receive"')
    }
    
    setGrammarSuggestions(suggestions)
  }

  // Advanced autocomplete with context awareness
  const getAutocomplete = (text: string, position: number) => {
    const beforeCursor = text.substring(0, position)
    const words = beforeCursor.split(/\s+/)
    const lastWord = words[words.length - 1].toLowerCase()
    
    const suggestions: Record<string, string[]> = {
      'thank': ['Thank you for your time', 'Thank you for considering', 'Thank you for the opportunity'],
      'please': ['Please let me know', 'Please find attached', 'Please feel free to contact me'],
      'i': ['I hope this email finds you well', 'I am writing to', 'I would like to'],
      'look': ['Looking forward to hearing from you', 'Looking forward to our meeting'],
      'best': ['Best regards', 'Best wishes'],
      'kind': ['Kind regards'],
      'sincer': ['Sincerely'],
      'regards': ['Regards'],
      'apolog': ['I apologize for any inconvenience', 'I apologize for the delay'],
      'follow': ['Following up on', 'Following our conversation'],
      'attach': ['Attached please find', 'Please find the attached document'],
      'meet': ['Meeting scheduled for', 'Let\'s schedule a meeting to discuss']
    }
    
    for (const [key, values] of Object.entries(suggestions)) {
      if (lastWord.startsWith(key) && lastWord.length >= 3) {
        return values[Math.floor(Math.random() * values.length)]
      }
    }
    return ''
  }

  // Sentiment analysis with emotion detection
  const analyzeSentiment = (text: string) => {
    const positive = ['excellent', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'best', 'perfect', 'delighted', 'excited', 'thank', 'appreciate']
    const negative = ['unfortunately', 'issue', 'problem', 'concern', 'difficult', 'apologize', 'sorry', 'mistake', 'error', 'disappointed', 'frustrated']
    const urgent = ['urgent', 'immediately', 'asap', 'critical', 'emergency', 'deadline', 'important']
    
    const lowerText = text.toLowerCase()
    let score = 0
    let isUrgent = false
    
    positive.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
      score += matches * 2
    })
    
    negative.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
      score -= matches * 2
    })
    
    urgent.forEach(word => {
      if (lowerText.includes(word)) isUrgent = true
    })
    
    // Normalize score to -100 to 100
    score = Math.max(-100, Math.min(100, score * 10))
    
    let label = 'Neutral'
    let color = 'gray'
    
    if (score > 30) {
      label = 'Very Positive'
      color = 'green'
    } else if (score > 10) {
      label = 'Positive'
      color = 'emerald'
    } else if (score < -30) {
      label = 'Negative'
      color = 'red'
    } else if (score < -10) {
      label = 'Slightly Negative'
      color = 'orange'
    }
    
    if (isUrgent) {
      label += ' (Urgent)'
      color = 'red'
    }
    
    setSentiment({ score, label, color })
  }

  // Calculate readability score (Flesch reading ease)
  const calculateReadability = (text: string) => {
    if (!text || text.length < 10) {
      setReadabilityScore({ score: 0, grade: 'N/A', complexity: 'Simple' })
      return
    }
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const words = text.split(/\s+/).filter(w => w.length > 0).length
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.match(/[aeiouy]+/gi)?.length || 1)
    }, 0)
    
    if (sentences === 0 || words === 0) {
      setReadabilityScore({ score: 0, grade: 'N/A', complexity: 'Simple' })
      return
    }
    
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    const normalizedScore = Math.max(0, Math.min(100, score))
    
    let grade = ''
    let complexity = ''
    
    if (normalizedScore >= 90) {
      grade = '5th grade'
      complexity = 'Very Easy'
    } else if (normalizedScore >= 80) {
      grade = '6th grade'
      complexity = 'Easy'
    } else if (normalizedScore >= 70) {
      grade = '7th grade'
      complexity = 'Fairly Easy'
    } else if (normalizedScore >= 60) {
      grade = '8-9th grade'
      complexity = 'Standard'
    } else if (normalizedScore >= 50) {
      grade = '10-12th grade'
      complexity = 'Fairly Difficult'
    } else if (normalizedScore >= 30) {
      grade = 'College'
      complexity = 'Difficult'
    } else {
      grade = 'Graduate'
      complexity = 'Very Difficult'
    }
    
    setReadabilityScore({ score: Math.round(normalizedScore), grade, complexity })
  }

  // Save version to history
  const saveVersion = () => {
    if (draft.body.trim() || draft.subject.trim()) {
      const version = {
        timestamp: new Date().toISOString(),
        content: draft.body,
        subject: draft.subject
      }
      setVersionHistory(prev => [...prev, version])
      setMessage({ type: 'success', text: 'Version saved to history' })
      setTimeout(() => setMessage(null), 2000)
    }
  }

  // Restore version from history
  const restoreVersion = (version: { content: string, subject: string }) => {
    setDraft(prev => ({
      ...prev,
      body: version.content,
      subject: version.subject
    }))
    setShowVersionHistory(false)
    setMessage({ type: 'success', text: 'Version restored' })
    setTimeout(() => setMessage(null), 2000)
  }

  // Generate AI insights
  const generateInsights = async () => {
    setShowInsights(true)
    const insights: string[] = []
    
    // Length analysis
    const wordCount = draft.body.split(/\s+/).filter(w => w.length > 0).length
    if (wordCount < 30) {
      insights.push('📊 Your email is concise (' + wordCount + ' words). Consider adding more context if needed.')
    } else if (wordCount > 200) {
      insights.push('📊 Your email is detailed (' + wordCount + ' words). Consider breaking it into sections.')
    } else {
      insights.push('📊 Perfect length (' + wordCount + ' words) for professional communication.')
    }
    
    // Question detection
    const questions = (draft.body.match(/\?/g) || []).length
    if (questions > 0) {
      insights.push('❓ ' + questions + ' question(s) detected. Ensure you provide context for answers.')
    }
    
    // Call to action
    const cta = ['please reply', 'let me know', 'get back to me', 'respond', 'confirm']
    const hasCTA = cta.some(phrase => draft.body.toLowerCase().includes(phrase))
    if (!hasCTA && wordCount > 50) {
      insights.push('🎯 Consider adding a clear call-to-action (e.g., "Please let me know your thoughts")')
    }
    
    // Time mentions
    const timeWords = ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'am', 'pm']
    const hasTime = timeWords.some(word => draft.body.toLowerCase().includes(word))
    if (hasTime && !draft.body.includes('timezone') && !draft.body.includes('UTC')) {
      insights.push('🌍 Time mentioned without timezone. Consider specifying timezone for clarity.')
    }
    
    // Politeness check
    const polite = ['please', 'thank', 'appreciate', 'kindly', 'grateful']
    const politenessCount = polite.reduce((count, word) => {
      return count + (draft.body.toLowerCase().match(new RegExp(word, 'g')) || []).length
    }, 0)
    
    if (politenessCount === 0 && wordCount > 30) {
      insights.push('💬 Add polite phrases like "please" or "thank you" for a friendlier tone.')
    } else if (politenessCount > 5) {
      insights.push('💬 Very polite tone! Balance politeness with directness.')
    }
    
    setAiInsights(insights)
  }

  // Smart contact suggestions
  const suggestContacts = (input: string) => {
    // Mock contacts database
    const contacts = [
      'john.doe@company.com',
      'jane.smith@company.com',
      'mike.johnson@client.com',
      'sarah.williams@partner.com',
      'david.brown@vendor.com',
      'emily.davis@company.com',
      'robert.miller@company.com'
    ]
    
    if (input.length < 2) {
      setSmartContacts([])
      setShowContactSuggestions(false)
      return
    }
    
    const filtered = contacts.filter(email => 
      email.toLowerCase().includes(input.toLowerCase())
    )
    
    setSmartContacts(filtered.slice(0, 5))
    setShowContactSuggestions(filtered.length > 0)
  }

  // Suggest best send time
  const suggestBestSendTime = () => {
    const now = new Date()
    const hour = now.getHours()
    
    let suggestion = ''
    if (hour < 9) {
      suggestion = 'Best time: 9:00 AM (Start of workday)'
    } else if (hour < 11) {
      suggestion = 'Best time: Now (Morning - High engagement)'
    } else if (hour < 14) {
      suggestion = 'Best time: 2:00 PM (After lunch)'
    } else if (hour < 17) {
      suggestion = 'Best time: Now (Afternoon)'
    } else {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      suggestion = 'Best time: Tomorrow 9:00 AM'
    }
    
    return suggestion
  }

  // Handle body text change with real-time AI features
  const handleBodyChange = (value: string) => {
    handleInputChange('body', value)
    
    // Real-time sentiment analysis
    if (value.length > 10) {
      analyzeSentiment(value)
      calculateReadability(value)
    }
    
    // Autocomplete
    const textarea = bodyRef.current
    if (textarea && aiFeatures.autoComplete) {
      const suggestion = getAutocomplete(value, textarea.selectionStart)
      setAutocompleteSuggestion(suggestion)
      setCursorPosition(textarea.selectionStart)
    }
    
    // Grammar check with debounce
    if (aiFeatures.grammarCheck) {
      setTimeout(() => checkGrammar(), 1000)
    }
  }

  const generateSubject = async () => {
    if (!draft.body) {
      setMessage({ type: 'error', text: 'Write email content first' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    setIsAIGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Extract key words from body
      const words = draft.body.split(' ').filter(w => w.length > 4)
      const subjects = [
        `Re: ${words[0] || 'Important'} Discussion`,
        `Follow-up: ${words[1] || 'Our Conversation'}`,
        `Quick Question About ${words[0] || 'Project'}`,
        `${words[0] || 'Update'} - Action Required`,
        `Meeting Request: ${words[1] || 'Discussion'}`
      ]
      
      const generated = subjects[Math.floor(Math.random() * subjects.length)]
      handleInputChange('subject', generated)
      setMessage({ type: 'success', text: 'Subject generated!' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsAIGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!draft.to.trim()) {
      setMessage({ type: 'error', text: 'Please enter at least one recipient' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (!draft.subject.trim()) {
      setMessage({ type: 'error', text: 'Please enter a subject' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsSending(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8003/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: draft.to.split(',').map(e => e.trim()),
          cc: draft.cc ? draft.cc.split(',').map(e => e.trim()) : [],
          bcc: draft.bcc ? draft.bcc.split(',').map(e => e.trim()) : [],
          subject: draft.subject,
          body: draft.body,
          attachments: draft.attachments.map(a => ({ name: a.name, size: a.size, type: a.type }))
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email sent successfully!' })
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to send email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSending(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-pink-500/10 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 glass border-b border-white/10 sticky top-0 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-6 h-6 text-gray-300" />
              </motion.button>
              <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Compose Email
                </h1>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={saveDraft}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-medium flex items-center gap-2 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save className="w-4 h-4" />
                Save Draft
              </motion.button>

              <motion.button
                onClick={() => setShowScheduler(!showScheduler)}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 font-medium flex items-center gap-2 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Clock className="w-4 h-4" />
                {scheduledTime ? 'Scheduled' : 'Schedule'}
              </motion.button>
              
              <motion.button
                onClick={handleSend}
                disabled={isSending}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : scheduledTime ? 'Schedule Send' : 'Send Email'}
              </motion.button>
            </div>

            {/* Schedule Modal */}
            <AnimatePresence>
              {showScheduler && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 glass rounded-xl border border-blue-500/20 p-4 min-w-[280px] z-50"
                >
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Schedule Send
                  </h4>
                  
                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => {
                        const time = new Date()
                        time.setHours(time.getHours() + 1)
                        setScheduledTime(time)
                        setShowScheduler(false)
                      }}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
                    >
                      In 1 hour
                    </button>
                    <button
                      onClick={() => {
                        const time = new Date()
                        time.setDate(time.getDate() + 1)
                        time.setHours(9, 0, 0, 0)
                        setScheduledTime(time)
                        setShowScheduler(false)
                      }}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
                    >
                      Tomorrow at 9:00 AM
                    </button>
                    <button
                      onClick={() => {
                        const time = new Date()
                        time.setDate(time.getDate() + ((1 + 7 - time.getDay()) % 7))
                        time.setHours(9, 0, 0, 0)
                        setScheduledTime(time)
                        setShowScheduler(false)
                      }}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
                    >
                      Next Monday at 9:00 AM
                    </button>
                  </div>

                  {scheduledTime && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-2">Scheduled for:</div>
                      <div className="text-sm text-blue-400 font-medium mb-2">
                        {scheduledTime.toLocaleString()}
                      </div>
                      <button
                        onClick={() => {
                          setScheduledTime(null)
                          setShowScheduler(false)
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Cancel schedule
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Wider and More Spacious */}
      <div className="relative z-10 container mx-auto px-6 py-8 max-w-7xl">
        {/* Message Alert */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced AI Features Banner - Enhanced Size */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 glass rounded-xl border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-base font-medium text-gray-300">AI Writing Assistant Active</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Tone: <span className="text-purple-400 font-semibold text-base">{selectedTone}</span></span>
                <span>•</span>
                <span>Mode: <span className="text-purple-400 font-semibold text-base">Smart Compose</span></span>
              </div>
            </div>
            <motion.button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-sm font-medium flex items-center gap-2 transition-all border border-purple-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              {showAIPanel ? 'Hide Panel' : 'Show Panel'}
            </motion.button>
          </div>

          {/* Advanced Metrics */}
          {draft.body && (
            <div className="flex items-center gap-6 pt-3 border-t border-white/10">
              {/* Sentiment Analysis */}
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Sentiment:</span>
                  <span className={`text-xs font-medium text-${sentiment.color}-400`}>
                    {sentiment.label}
                  </span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${sentiment.color}-400 transition-all`}
                      style={{ width: `${Math.abs(sentiment.score)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Readability Score */}
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Readability:</span>
                  <span className="text-xs font-medium text-blue-400">
                    {readabilityScore.complexity} ({readabilityScore.grade})
                  </span>
                </div>
              </div>

              {/* Word Count */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {draft.body.split(/\s+/).filter(w => w.length > 0).length} words
                </span>
              </div>

              {/* AI Insights Button */}
              <motion.button
                onClick={generateInsights}
                className="ml-auto px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-3 h-3" />
                Get Insights
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* AI Insights Panel */}
        <AnimatePresence>
          {showInsights && aiInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 glass rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Insights & Recommendations
                </h3>
                <button
                  onClick={() => setShowInsights(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg"
                  >
                    {insight}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose Form - Enhanced Size */}
        <motion.div 
          className="glass rounded-2xl p-10 border border-purple-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Recipients Section */}
          <div className="space-y-5 mb-8">
            {/* To Field with Smart Contacts */}
            <div className="flex items-start gap-3">
              <label className="text-gray-400 text-base font-medium pt-4 w-20">To:</label>
              <div className="flex-1 relative">
                <input
                  ref={toInputRef}
                  type="text"
                  value={draft.to}
                  onChange={(e) => {
                    handleInputChange('to', e.target.value)
                    suggestContacts(e.target.value)
                  }}
                  onFocus={(e) => suggestContacts(e.target.value)}
                  onBlur={() => setTimeout(() => setShowContactSuggestions(false), 200)}
                  placeholder="recipient@example.com, another@example.com"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
                
                {/* Smart Contact Suggestions */}
                <AnimatePresence>
                  {showContactSuggestions && smartContacts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-purple-500/20 p-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {smartContacts.map((contact, index) => (
                        <motion.button
                          key={index}
                          onClick={() => {
                            handleInputChange('to', contact)
                            setShowContactSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-purple-500/20 rounded-lg transition-colors text-sm text-gray-300 flex items-center gap-2"
                          whileHover={{ x: 4 }}
                        >
                          <Users className="w-4 h-4 text-purple-400" />
                          {contact}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowCc(!showCc)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    showCc ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cc
                </motion.button>
                <motion.button
                  onClick={() => setShowBcc(!showBcc)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    showBcc ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Bcc
                </motion.button>
              </div>
            </div>

            {/* CC Field */}
            <AnimatePresence>
              {showCc && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3"
                >
                  <label className="text-gray-400 text-base font-medium pt-4 w-20">Cc:</label>
                  <input
                    type="text"
                    value={draft.cc}
                    onChange={(e) => handleInputChange('cc', e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* BCC Field */}
            <AnimatePresence>
              {showBcc && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3"
                >
                  <label className="text-gray-400 text-base font-medium pt-4 w-20">Bcc:</label>
                  <input
                    type="text"
                    value={draft.bcc}
                    onChange={(e) => handleInputChange('bcc', e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subject Field */}
            <div className="flex items-start gap-3">
              <label className="text-gray-400 text-base font-medium pt-4 w-20">Subject:</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter subject"
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <motion.button
                  onClick={generateSubject}
                  disabled={isAIGenerating}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Generate subject with AI"
                >
                  <Sparkles className="w-4 h-4" />
                  AI
                </motion.button>
              </div>
            </div>
          </div>

          {/* AI Control Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-8 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    AI Writing Assistant
                  </h3>
                  <motion.button
                    onClick={() => setShowAIPanel(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>

                {/* Tone Selector */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Select Tone:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['professional', 'casual', 'friendly', 'formal'] as const).map((tone) => (
                      <motion.button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTone === tone
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Template Category Selector */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Template Category:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['business', 'personal', 'support', 'sales'] as const).map((category) => (
                      <motion.button
                        key={category}
                        onClick={() => setEmailTemplateCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          emailTemplateCategory === category
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* AI Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => {
                      const prompt = window.prompt('What would you like the email to be about?')
                      if (prompt) generateAIContent(prompt)
                    }}
                    disabled={isAIGenerating}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isAIGenerating ? 'Generating...' : 'Write for Me'}
                  </motion.button>

                  <motion.button
                    onClick={improveWithAI}
                    disabled={isAIGenerating || !draft.body}
                    className="px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Improve Text
                  </motion.button>

                  <motion.button
                    onClick={checkGrammar}
                    disabled={!draft.body}
                    className="px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 rounded-xl text-orange-400 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Check Grammar
                  </motion.button>

                  <motion.button
                    onClick={getAISuggestion}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Tips
                  </motion.button>
                </div>

                {/* Grammar Suggestions */}
                {grammarSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                  >
                    <p className="text-sm font-medium text-orange-400 mb-2">Grammar Suggestions:</p>
                    <ul className="space-y-1">
                      {grammarSuggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-orange-300">• {suggestion}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formatting Toolbar */}
          <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button
                onClick={() => applyFormatting('bold')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Bold"
              >
                <Bold className="w-4 h-4 text-gray-400" />
              </motion.button>
              <motion.button
                onClick={() => applyFormatting('italic')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Italic"
              >
                <Italic className="w-4 h-4 text-gray-400" />
              </motion.button>
              <motion.button
                onClick={() => applyFormatting('underline')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Underline"
              >
                <Underline className="w-4 h-4 text-gray-400" />
              </motion.button>
              
              <div className="w-px h-6 bg-white/10 mx-2" />
              
              <motion.button
                onClick={() => applyFormatting('link')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4 text-gray-400" />
              </motion.button>
              
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Attach File"
              >
                <Paperclip className="w-4 h-4 text-gray-400" />
              </motion.button>

              <div className="w-px h-6 bg-white/10 mx-2" />

              <motion.button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border ${
                  showAIPanel
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500'
                    : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 border-purple-500/30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-3 h-3" />
                {showAIPanel ? 'Hide AI' : 'AI Assistant'}
              </motion.button>

              <div className="w-px h-6 bg-white/10 mx-2" />

              <motion.button
                onClick={getAISuggestion}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-xs font-medium flex items-center gap-2 transition-all border border-blue-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-3 h-3" />
                Quick Tip
              </motion.button>
            </div>
          </div>

          {/* AI Suggestion Box */}
          <AnimatePresence>
            {showAIAssist && aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-300 font-medium mb-1">AI Suggestion</p>
                    <p className="text-sm text-gray-300">{aiSuggestion}</p>
                  </div>
                  <motion.button
                    onClick={() => setShowAIAssist(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced AI Templates with Categories */}
          {!draft.body && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Start with an AI template ({emailTemplateCategory}):
                </p>
                <div className="flex items-center gap-1">
                  {(['business', 'personal', 'support', 'sales'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEmailTemplateCategory(cat)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        emailTemplateCategory === cat
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Templates based on Category */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {emailTemplateCategory === 'business' && [
                  { label: '📧 Proposal', prompt: 'professional business proposal with clear objectives' },
                  { label: '📊 Report', prompt: 'business report summary email' },
                  { label: '🤝 Partnership', prompt: 'partnership collaboration request' },
                  { label: '💼 Job Application', prompt: 'professional job application email' }
                ].map((template) => (
                  <motion.button
                    key={template.label}
                    onClick={() => generateAIContent(template.prompt)}
                    disabled={isAIGenerating}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {template.label}
                  </motion.button>
                ))}

                {emailTemplateCategory === 'personal' && [
                  { label: '🎉 Celebration', prompt: 'warm celebration message' },
                  { label: '💌 Invitation', prompt: 'friendly personal invitation' },
                  { label: '🙏 Thank You', prompt: 'heartfelt thank you message' },
                  { label: '✨ Catch Up', prompt: 'friendly catch up email' }
                ].map((template) => (
                  <motion.button
                    key={template.label}
                    onClick={() => generateAIContent(template.prompt)}
                    disabled={isAIGenerating}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {template.label}
                  </motion.button>
                ))}

                {emailTemplateCategory === 'support' && [
                  { label: '🆘 Help Request', prompt: 'polite customer support help request' },
                  { label: '🐛 Bug Report', prompt: 'detailed bug report email' },
                  { label: '💡 Feature Request', prompt: 'feature suggestion email' },
                  { label: '📞 Follow-up', prompt: 'support ticket follow-up' }
                ].map((template) => (
                  <motion.button
                    key={template.label}
                    onClick={() => generateAIContent(template.prompt)}
                    disabled={isAIGenerating}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {template.label}
                  </motion.button>
                ))}

                {emailTemplateCategory === 'sales' && [
                  { label: '🎯 Cold Outreach', prompt: 'engaging sales cold email' },
                  { label: '📈 Demo Request', prompt: 'product demo request email' },
                  { label: '🤝 Follow-up', prompt: 'sales follow-up after meeting' },
                  { label: '💎 Value Proposition', prompt: 'compelling value proposition email' }
                ].map((template) => (
                  <motion.button
                    key={template.label}
                    onClick={() => generateAIContent(template.prompt)}
                    disabled={isAIGenerating}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {template.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Body Field with Advanced Features */}
          <div className="mb-6 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400 font-medium">Message</label>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={saveVersion}
                  disabled={!draft.body.trim() && !draft.subject.trim()}
                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Save current version"
                >
                  <Save className="w-3 h-3" />
                  Save Version
                </motion.button>
                <motion.button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  disabled={versionHistory.length === 0}
                  className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="View version history"
                >
                  <Clock className="w-3 h-3" />
                  History ({versionHistory.length})
                </motion.button>
              </div>
            </div>

            <textarea
              ref={bodyRef}
              value={draft.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Compose your email... (AI will help you write better)"
              rows={20}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none leading-relaxed"
              style={{ minHeight: '500px' }}
            />

            {/* Autocomplete Suggestion */}
            {autocompleteSuggestion && aiFeatures.autoComplete && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 bottom-20 px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/30 rounded-lg backdrop-blur-sm"
              >
                <div className="text-xs text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300">{autocompleteSuggestion}</span>
                  <span className="text-gray-500 text-[10px] ml-2">Press Tab to accept</span>
                </div>
              </motion.div>
            )}

            {/* AI Generating Indicator */}
            {isAIGenerating && (
              <div className="absolute top-12 right-3 flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </motion.div>
                <span className="text-xs text-purple-300">AI is writing...</span>
              </div>
            )}

            {/* Best Send Time Suggestion */}
            {draft.body && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {suggestBestSendTime()}
              </div>
            )}
          </div>

          {/* Version History Modal */}
          <AnimatePresence>
            {showVersionHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowVersionHistory(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden border border-purple-500/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                      Version History
                    </h3>
                    <button
                      onClick={() => setShowVersionHistory(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {versionHistory.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No versions saved yet
                      </div>
                    ) : (
                      versionHistory.map((version, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-semibold text-white">{version.subject || 'No Subject'}</h4>
                              <p className="text-xs text-gray-500">
                                {new Date(version.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => restoreVersion(version)}
                              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-purple-400 text-xs font-medium transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Restore
                            </motion.button>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {version.content}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachments */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <AnimatePresence>
            {draft.attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <p className="text-sm text-gray-400 mb-3 font-medium">
                  Attachments ({draft.attachments.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {draft.attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Paperclip className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(attachment.size)}</p>
                      </div>
                      <motion.button
                        onClick={() => removeAttachment(attachment.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Type className="w-3 h-3" />
                {draft.body.length} characters
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {draft.body.split(/\s+/).filter(w => w.length > 0).length} words
              </span>
              {draft.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {draft.attachments.length} attachment{draft.attachments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mt-6 flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => {
              if (confirm('Discard this draft?')) {
                setDraft({
                  to: '',
                  cc: '',
                  bcc: '',
                  subject: '',
                  body: '',
                  attachments: []
                })
                router.push('/dashboard')
              }
            }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
            Discard
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
