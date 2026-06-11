'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

const quickQuestions = [
  "Track my shipment",
  "Shipping rates",
  "Delivery time",
  "Contact support"
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Parcel Point AI Assistant. How can I help you with your logistics needs today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('track') || lowerMessage.includes('shipment') || lowerMessage.includes('where')) {
      return "You can track your shipment by entering your tracking number on our homepage. Would you like me to guide you to the tracking page?"
    }
    else if (lowerMessage.includes('rate') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return "Our shipping rates depend on weight, dimensions, and destination. For international shipping, rates start at $25 for documents and $45 for packages. Would you like a custom quote?"
    }
    else if (lowerMessage.includes('time') || lowerMessage.includes('delivery') || lowerMessage.includes('how long') || lowerMessage.includes('when')) {
      return "Delivery times vary by service: Air Freight (1-3 days), Ocean Freight (10-30 days), Road Freight (1-5 days). Express options are available for urgent shipments."
    }
    else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('human')) {
      return "You can reach our 24/7 support team at:\nPhone: +63 956 988 3401 (PH)  |  +44 839 528 4814 (UK)\nWhatsApp: +63 956 988 3401\nEmail: hello@parcelpoint.com\nLive Chat: Available now\nOr visit our Help Center for FAQs."
    }
    else if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('what do you do')) {
      return "We offer comprehensive logistics services:\nAir Freight\nOcean Freight\nRoad Freight\nWarehousing\nInternational Shipping\nCustoms Clearance\nWhich service interests you?"
    }
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to Parcel Point. I'm here to help with tracking, shipping rates, delivery times, or any logistics questions. What can I assist you with today?"
    }
    else if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm glad I could help. Is there anything else you need assistance with regarding your logistics needs?"
    }
    else {
      return "I understand you're asking about \"" + userMessage + "\". I can help with tracking shipments, shipping rates, delivery times, and general logistics support. Could you provide more details about what you need?"
    }
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate AI thinking and typing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickQuestion = (question: string) => {
    setInputText(question)
    // Auto-send after a brief delay to show the question being typed
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: question,
        sender: 'user',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setInputText('')
      setIsTyping(true)

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: generateAIResponse(question),
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
        setIsTyping(false)
      }, 1500)
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen mesh-gradient">
      <header className="glass-header sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" priority />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Parcel Point</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link text-sm">Home</Link>
            <Link href="/about" className="nav-link text-sm">About</Link>
            <Link href="/services" className="nav-link text-sm">Services</Link>
            <Link href="/contact" className="nav-link text-sm">Contact</Link>
          </nav>
          <Link href="/" className="glass-button px-4 py-2 text-sm text-white">← Back</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-high-contrast mb-3">AI Live Chat Support</h1>
          <div className="w-16 h-1 bg-[#7C3AED] mx-auto rounded-full mb-4"></div>
          <p className="text-white/70 text-lg">Get instant answers to your logistics questions</p>
        </div>

        {/* Chat Container */}
        <div className="glass-panel overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Chat Header */}
          <div className="bg-[#7C3AED]/20 p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Parcel Point AI Assistant</h3>
              <p className="text-white/60 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#7C3AED] text-white rounded-br-none'
                      : 'bg-white/10 text-white rounded-bl-none border border-white/20'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-white/40'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white p-4 rounded-2xl rounded-bl-none border border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 py-2 border-t border-white/10">
            <p className="text-white/60 text-sm mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-3 py-1 text-sm bg-white/10 hover:bg-[#7C3AED]/20 text-white rounded-full border border-white/20 hover:border-[#7C3AED]/50 transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 glass-input glass-input-lime"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="parcelpoint-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-white/40 text-xs mt-2 text-center">
              Powered by Parcel Point AI — For urgent matters, call +63 956 988 3401
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
