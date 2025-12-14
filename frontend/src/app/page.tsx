'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Mail, Shield, Zap, Users, BarChart3, Sparkles, 
  Check, ArrowRight, Star, Globe, Lock, TrendingUp,
  Clock, Database, Settings, MessageSquare, Rocket, Brain
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([])
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    // Generate particles on client side only
    setParticles(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      }))
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Mouse-following gradient */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x - 300,
            y: mousePosition.y - 300,
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 50,
          }}
        />
        
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-50, 50, -50],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating particles */}
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Mail className="w-8 h-8 text-purple-400" />
              </motion.div>
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Mail Manager Pro
              </motion.span>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {['Features', 'Pricing', 'Testimonials'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-white transition-colors relative group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  {item}
                  <motion.span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
              <motion.a
                href="/login"
                className="px-5 py-2 text-gray-300 hover:text-white transition-colors font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.a>
              <motion.a
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">Register</span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 relative overflow-hidden"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400 relative z-10" />
              </motion.div>
              <span className="text-sm font-medium text-gray-300 relative z-10">
                🔒 Trusted by 50,000+ Enterprise Teams
              </span>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl font-bold mb-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.span
                className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient inline-block"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Enterprise Email
              </motion.span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient inline-block"
                animate={{
                  backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Management Evolved
              </motion.span>
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              />
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              AI-powered platform that transforms how enterprises manage, secure, and optimize their email communications at scale
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button 
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2 relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <motion.span className="relative z-10">Start Free Trial</motion.span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5 relative z-10" />
                </motion.div>
              </motion.button>
              <motion.button 
                className="px-8 py-4 glass rounded-xl font-bold text-lg relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Watch Demo
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Rocket className="w-5 h-5" />
                  </motion.div>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {[
              { label: 'Uptime', value: '99.99%', icon: TrendingUp },
              { label: 'Enterprise Clients', value: '50K+', icon: Users },
              { label: 'Emails Processed', value: '1B+', icon: Mail },
              { label: 'Response Time', value: '<50ms', icon: Zap },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="glass rounded-2xl p-6 text-center relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -5 }}
                animate={{ 
                  boxShadow: ['0 0 20px rgba(168,85,247,0.1)', '0 0 40px rgba(168,85,247,0.3)', '0 0 20px rgba(168,85,247,0.1)']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-3 relative z-10" />
                </motion.div>
                <motion.div 
                  className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-400 mt-1 relative z-10">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything your organization needs to manage email at scale
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Advanced Security',
                description: 'Enterprise-grade encryption, DLP, and compliance with SOC 2, ISO 27001, GDPR',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Sparkles,
                title: 'AI Intelligence',
                description: 'Smart categorization, sentiment analysis, and automated responses powered by advanced AI',
                color: 'from-pink-500 to-rose-500'
              },
              {
                icon: Zap,
                title: 'Lightning Performance',
                description: 'Process millions of emails with <50ms latency and 99.99% uptime SLA',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Lock,
                title: 'Data Protection',
                description: 'End-to-end encryption, zero-knowledge architecture, and HIPAA compliance',
                color: 'from-purple-500 to-blue-500'
              },
              {
                icon: BarChart3,
                title: 'Analytics Suite',
                description: 'Real-time insights, custom dashboards, and predictive analytics for email trends',
                color: 'from-pink-500 to-purple-500'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Shared inboxes, role-based access, and seamless team workflows',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Database,
                title: 'Unlimited Storage',
                description: 'Secure cloud storage with instant search across billions of messages',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Globe,
                title: 'Multi-Domain Support',
                description: 'Manage unlimited domains and email accounts from a single dashboard',
                color: 'from-blue-500 to-purple-500'
              },
              {
                icon: Settings,
                title: 'Custom Automation',
                description: 'Build sophisticated workflows with visual automation builder and API access',
                color: 'from-pink-500 to-purple-500'
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass rounded-2xl p-8 cursor-pointer group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"
                  initial={{ opacity: 0 }}
                  animate={hoveredCard === index ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 relative z-10`}
                  animate={hoveredCard === index ? { 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ 
                    rotate: { duration: 0.6 },
                    scale: { duration: 0.4 }
                  }}
                >
                  <motion.div
                    animate={hoveredCard === index ? {
                      y: [0, -5, 0],
                    } : {}}
                    transition={{ duration: 0.6, repeat: hoveredCard === index ? Infinity : 0 }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  {feature.description}
                </p>
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${hoveredCard === index ? 'rgba(168,85,247,0.5)' : 'transparent'}, transparent)`,
                  }}
                  animate={hoveredCard === index ? {
                    x: ['-100%', '100%'],
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Flexible plans designed for organizations of all sizes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Professional',
                price: '$49',
                period: 'per user/month',
                description: 'Perfect for growing teams',
                features: [
                  'Up to 50 users',
                  '500GB storage per user',
                  'Advanced AI features',
                  'Priority support',
                  'Custom integrations',
                  'API access'
                ],
                popular: false
              },
              {
                name: 'Enterprise',
                price: '$149',
                period: 'per user/month',
                description: 'For large organizations',
                features: [
                  'Unlimited users',
                  'Unlimited storage',
                  'Advanced security & compliance',
                  'Dedicated account manager',
                  'SLA guarantee',
                  'Custom AI training',
                  'White-label options',
                  'On-premise deployment'
                ],
                popular: true
              },
              {
                name: 'Ultimate',
                price: 'Custom',
                period: 'contact sales',
                description: 'Tailored enterprise solutions',
                features: [
                  'Everything in Enterprise',
                  'Custom infrastructure',
                  'Dedicated support team',
                  'Advanced security audits',
                  'Custom SLA terms',
                  'Priority feature development',
                  'Training & onboarding',
                  'Strategic consulting'
                ],
                popular: false
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`glass rounded-2xl p-8 relative overflow-hidden ${plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ scale: plan.popular ? 1.07 : 1.05, y: -10 }}
              >
                {plan.popular && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4 relative z-10"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: ['0 0 20px rgba(168,85,247,0.5)', '0 0 30px rgba(168,85,247,0.8)', '0 0 20px rgba(168,85,247,0.5)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.span
                        animate={{ opacity: [1, 0.8, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        ⭐ Most Popular
                      </motion.span>
                    </motion.div>
                  </>
                )}
                <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{plan.name}</h3>
                <p className="text-gray-400 mb-6 relative z-10">{plan.description}</p>
                <div className="mb-6 relative z-10">
                  <motion.span 
                    className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent inline-block"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {plan.price}
                  </motion.span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 relative z-10">
                  {plan.features.map((feature, idx) => (
                    <motion.li 
                      key={idx} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + idx * 0.05, type: "spring", stiffness: 500 }}
                      >
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.button
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden group z-10 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'glass'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {plan.popular && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what enterprise customers are saying about Mail Manager Pro
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'CTO, TechCorp Global',
                company: 'Fortune 500',
                quote: 'Mail Manager Pro transformed our email infrastructure. The AI capabilities and security features are unmatched in the enterprise space.',
                rating: 5
              },
              {
                name: 'Michael Chen',
                role: 'VP of Operations, DataFlow Inc',
                company: 'Series C Startup',
                quote: 'The performance and scalability are incredible. We process millions of emails daily with zero issues. Best investment we\'ve made.',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                role: 'Director of IT, SecureBank',
                company: 'Financial Services',
                quote: 'Security and compliance features are exceptional. HIPAA and SOC 2 compliance out of the box saved us months of work.',
                rating: 5
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="glass rounded-2xl p-8 relative overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="flex gap-1 mb-4 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                    >
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic relative z-10">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 relative z-10">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {testimonial.name.charAt(0)}
                  </motion.div>
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-xs text-purple-400">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass rounded-3xl p-12 text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="inline-block mb-6 relative z-10"
            >
              <MessageSquare className="w-16 h-16 text-purple-400" />
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Ready to Transform Your Email Management?
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Join 50,000+ enterprises using Mail Manager Pro. Start your free 30-day trial today.
            </motion.p>
            <motion.button
              className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl inline-flex items-center gap-3 relative overflow-hidden group z-10"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10">Start Free Trial</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </motion.button>
            <p className="text-sm text-gray-400 mt-4">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-6 h-6 text-purple-400" />
                <span className="font-bold text-lg">Mail Manager Pro</span>
              </div>
              <p className="text-gray-400 text-sm">
                Enterprise email management powered by AI
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Mail Manager Pro. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
