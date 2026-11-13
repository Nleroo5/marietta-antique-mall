'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { BUSINESS_NAME, CONTACT_INFO } from '@/lib/constants'
import Button from '@/components/ui/Button'
import Card, { CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/spam-guard'

export default function VendorsPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showExperience, setShowExperience] = useState(false)
  const applicationRef = useRef(null)
  // Stamped after mount rather than during render, so the server and client
  // never disagree on the value. A script POSTing straight to the endpoint
  // never runs this, and the route rejects submissions without it.
  const renderedAtRef = useRef<number | null>(null)
  useEffect(() => {
    renderedAtRef.current = Date.now()
  }, [])
  const isInView = useInView(applicationRef, { once: true })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const formData = new FormData(e.currentTarget)
      if (renderedAtRef.current !== null) {
        formData.set(RENDERED_AT_FIELD, String(renderedAtRef.current))
      }

      const response = await fetch('/api/dealer-application', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Track GA4 lead conversion - CRITICAL BUSINESS EVENT
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'generate_lead', {
            lead_type: 'vendor_application',
            space_type: formData.get('spaceNeeded'),
            move_in_month: formData.get('moveInMonth'),
            value: 200,
            currency: 'USD'
          })
        }

        setSubmitStatus('success')
        formRef.current?.reset()
        setShowExperience(false)
        // Scroll to success message
        setTimeout(() => {
          document.getElementById('form-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToForm = () => {
    applicationRef.current && (applicationRef.current as HTMLElement).scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const benefits = [
    {
      title: "Prime Location",
      description: "30,000 sq ft facility on Roswell Road with high visibility and steady foot traffic"
    },
    {
      title: "Hassle-Free Operations",
      description: "We handle all sales, credit card processing, and sales tax collection for you"
    },
    {
      title: "Flexible Payments",
      description: "Receive checks twice monthly (5th & 20th) with daily email sales reports"
    },
    {
      title: "Established Customer Base",
      description: "Benefit from our loyal customer base and strong social media presence"
    },
    {
      title: "Open 7 Days a Week",
      description: "Maximum exposure for your merchandise with convenient hours for customers"
    },
    {
      title: "Growth Opportunities",
      description: "Start with one booth and expand as your business grows"
    }
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes lever-sway {
          0%, 100% {
            transform: translateY(-6px) rotate(-2deg);
          }
          50% {
            transform: translateY(-6px) rotate(2deg);
          }
        }
        .wood-card-wrapper:hover .wood-card {
          animation: lever-sway 1.5s ease-in-out infinite;
        }
        .wood-card-wrapper:hover .wood-card h3 {
          color: #2A2A2A;
        }
        .wood-card-wrapper:hover .wood-card p {
          color: #2A2A2A;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 1) 40%,
            rgba(201, 168, 106, 1) 50%,
            rgba(0, 0, 0, 1) 60%,
            rgba(0, 0, 0, 1) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}} />
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-light/50 to-white py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Become a Vendor at {BUSINESS_NAME}
            </h1>
            <p className="text-xl text-black mb-8">
              Join 100+ independent dealers in Georgia&apos;s premier antique destination.
              Booth spaces available starting at $200/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" onClick={scrollToForm}>
                Apply Now
              </Button>
              <Button variant="accent" size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Why Join Our Community?
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Over 100 vendors trust us to showcase their collections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="wood-card-wrapper"
              >
                <div
                  className="wood-card relative px-6 py-8 cursor-pointer"
                  style={{
                    backgroundColor: '#FAF8F5',
                    backgroundImage: `
                      linear-gradient(180deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.55) 100%),
                      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Cdefs%3E%3Cpattern id='woodsketch2' x='0' y='0' width='400' height='600' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50,0 Q48,150 50,300 T50,600' stroke='%23B89968' stroke-width='1' fill='none' opacity='0.25'/%3E%3Cpath d='M55,0 Q53,150 55,300 T55,600' stroke='%23C9A86A' stroke-width='0.7' fill='none' opacity='0.17'/%3E%3Cpath d='M100,0 Q102,150 100,300 T100,600' stroke='%23A0826D' stroke-width='0.9' fill='none' opacity='0.22'/%3E%3Cpath d='M150,0 Q148,150 150,300 T150,600' stroke='%23B89968' stroke-width='1' fill='none' opacity='0.24'/%3E%3Cpath d='M155,0 Q157,150 155,300 T155,600' stroke='%23C9A86A' stroke-width='0.7' fill='none' opacity='0.16'/%3E%3Cpath d='M200,0 Q198,150 200,300 T200,600' stroke='%238B6F47' stroke-width='1.1' fill='none' opacity='0.27'/%3E%3Cpath d='M205,0 Q207,150 205,300 T205,600' stroke='%23C9A86A' stroke-width='0.7' fill='none' opacity='0.19'/%3E%3Cpath d='M250,0 Q252,150 250,300 T250,600' stroke='%23B89968' stroke-width='0.9' fill='none' opacity='0.22'/%3E%3Cpath d='M300,0 Q298,150 300,300 T300,600' stroke='%23A0826D' stroke-width='0.9' fill='none' opacity='0.21'/%3E%3Cpath d='M350,0 Q352,150 350,300 T350,600' stroke='%23B89968' stroke-width='0.9' fill='none' opacity='0.21'/%3E%3Cellipse cx='200' cy='200' rx='40' ry='35' stroke='%238B6F47' stroke-width='1' fill='none' opacity='0.22'/%3E%3Cellipse cx='200' cy='200' rx='32' ry='28' stroke='%238B6F47' stroke-width='0.8' fill='none' opacity='0.19'/%3E%3Cellipse cx='200' cy='200' rx='24' ry='20' stroke='%23B89968' stroke-width='0.7' fill='none' opacity='0.16'/%3E%3Cellipse cx='100' cy='400' rx='35' ry='30' stroke='%23A0826D' stroke-width='0.9' fill='none' opacity='0.21'/%3E%3Cellipse cx='100' cy='400' rx='26' ry='22' stroke='%23B89968' stroke-width='0.8' fill='none' opacity='0.17'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23woodsketch2)'/%3E%3C/svg%3E")
                    `,
                    backgroundSize: '400px 600px',
                    border: '1.5px solid #D4C4B0',
                    boxShadow: `
                      inset 0 1px 2px rgba(255, 255, 255, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.07),
                      0 8px 16px rgba(139, 111, 71, 0.15),
                      0 2px 4px rgba(0, 0, 0, 0.05)
                    `,
                    borderRadius: '4px',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-60 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, transparent 0%, rgba(201, 168, 106, 0.4) 50%, transparent 100%)',
                    }}
                  />
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2 relative z-10">
                    {benefit.title}
                  </h3>
                  <p className="text-charcoal relative z-10">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding bg-gradient-to-b from-white to-slate-light/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Booth Options & Pricing
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Flexible space options to fit your inventory and budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Standard Booth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="cursor-pointer"
            >
              <div
                className="relative rounded-2xl shadow-lg p-6 border-2 border-mauve h-full transition-shadow duration-300 hover:shadow-2xl"
                style={{
                  backgroundColor: 'white',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[4px] opacity-60" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(201, 168, 106, 0.5) 50%, transparent 100%)' }} />
                <div className="text-center mb-4">
                  <h3 className="font-display text-2xl font-bold text-black mb-2">Standard Booth</h3>
                  <p className="text-4xl font-bold text-black">$200<span className="text-lg text-black">/mo</span></p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-xl font-semibold text-black">8&apos; × 8&apos;</p>
                  <p className="text-sm text-charcoal">64 sq ft</p>
                </div>
                <ul className="space-y-2 text-black mb-6">
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.03, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Perfect for starting out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 1, 1, 1, 0],
                        scale: [0, 0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.2, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Standard booth location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 0, 1, 1, 0],
                        scale: [0, 0, 0, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.33, 0.37, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Best for focused collections</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Medium Booth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="cursor-pointer"
            >
              <div
                className="relative rounded-2xl shadow-lg p-6 border-2 border-accent h-full transition-shadow duration-300 hover:shadow-2xl"
                style={{
                  backgroundColor: 'white',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[4px] opacity-60" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(201, 168, 106, 0.5) 50%, transparent 100%)' }} />
                <div className="text-center mb-4">
                  <h3 className="font-display text-2xl font-bold text-black mb-2">Medium Booth</h3>
                  <p className="text-4xl font-bold text-black">$225-$300<span className="text-lg text-black">/mo</span></p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-xl font-semibold text-black">8&apos; × 9&apos;</p>
                  <p className="text-sm text-charcoal">72 sq ft</p>
                </div>
                <ul className="space-y-2 text-black mb-6">
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.03, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Price varies by location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 1, 1, 1, 0],
                        scale: [0, 0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.2, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Better visibility options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 0, 1, 1, 0],
                        scale: [0, 0, 0, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.33, 0.37, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Great for growing inventory</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Large Booth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="cursor-pointer"
            >
              <div
                className="relative rounded-2xl shadow-lg p-6 border-2 border-mauve h-full transition-shadow duration-300 hover:shadow-2xl"
                style={{
                  backgroundColor: 'white',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[4px] opacity-60" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(201, 168, 106, 0.5) 50%, transparent 100%)' }} />
                <div className="text-center mb-4">
                  <h3 className="font-display text-2xl font-bold text-black mb-2">Large Booth</h3>
                  <p className="text-4xl font-bold text-black">$275-$325<span className="text-lg text-black">/mo</span></p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-xl font-semibold text-black">8&apos; × 13&apos;</p>
                  <p className="text-sm text-charcoal">104 sq ft</p>
                </div>
                <ul className="space-y-2 text-black mb-6">
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.03, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Price varies by location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 1, 1, 1, 0],
                        scale: [0, 0, 1, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.2, 0.67, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Premium locations available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <motion.svg
                      className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{
                        opacity: [0, 0, 0, 1, 1, 0],
                        scale: [0, 0, 0, 1, 1, 0]
                      }}
                      transition={{
                        duration: 9,
                        times: [0, 0.17, 0.33, 0.37, 0.97, 1],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span>Best for furniture & large items</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 text-center max-w-3xl mx-auto">
            <Card className="!border-2 !border-mauve transition-all duration-300 hover:shadow-xl hover:-translate-y-2 !cursor-default">
              <CardBody>
                <h3 className="font-display text-xl font-bold text-black mb-3">Additional Options Available</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="font-semibold text-black mb-1">Display Cases</p>
                    <p className="text-sm text-charcoal">$50-$200/month - Perfect for jewelry & collectibles</p>
                  </div>
                  <div>
                    <p className="font-semibold text-black mb-1">Endcap Spaces</p>
                    <p className="text-sm text-charcoal">$25-$35/month - Premium corner visibility</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Lease Terms Section */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Lease Terms & Commission
            </h2>
            <p className="text-lg text-black">
              Simple, transparent pricing with no hidden fees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="!border !border-green-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 !cursor-default">
              <CardBody>
                <h3 className="font-display text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Lease Requirements
                </h3>
                <ul className="space-y-3 text-black">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>6 months</strong> minimum lease</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>1 month deposit</strong> due with first month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Deposit applied as <strong>final month rent</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Restore booth to original condition upon exit</span>
                  </li>
                </ul>
              </CardBody>
            </Card>

            <Card className="!border !border-green-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 !cursor-default">
              <CardBody>
                <h3 className="font-display text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Fees & Payments
                </h3>
                <ul className="space-y-3 text-black">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>10% commission</strong> on all sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>3% credit card fee</strong> (additional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>We handle <strong>all sales tax</strong> collection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Checks issued <strong>5th & 20th</strong> monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Daily sales reports</strong> via email</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section ref={applicationRef} className="section-padding bg-gradient-to-b from-white to-slate-light/30">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
                Dealer Space Request Form
              </h2>
              <p className="text-lg text-black max-w-2xl mx-auto">
                Complete the form below to apply for booth space at {BUSINESS_NAME}.
                We&apos;ll review your application and contact you within 3-5 business days.
              </p>
            </div>

            {/* Form Status Messages */}
            <div id="form-status" className="mb-6">
              {submitStatus === 'success' && (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">Application Submitted Successfully!</h3>
                      <p className="text-green-800 mb-3">
                        Thank you for your interest in {BUSINESS_NAME}. We&apos;ve received your application
                        and will review it within 3-5 business days.
                      </p>
                      <div className="bg-white/50 rounded p-3 mb-3">
                        <p className="text-sm font-semibold text-green-900 mb-1">What&apos;s Next?</p>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>✓ We&apos;ll review your application and merchandise photos</li>
                          <li>✓ If approved, we&apos;ll contact you to discuss available spaces</li>
                          <li>✓ Questions? Call us at {CONTACT_INFO.phone}</li>
                        </ul>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => window.location.href = '/'}>
                        Return to Home
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold text-red-900 mb-2">Submission Failed</h3>
                      <p className="text-red-800 mb-3">
                        We encountered an error submitting your application. Please try again or contact us directly.
                      </p>
                      <div className="flex gap-3">
                        <Button variant="accent" size="sm" onClick={() => setSubmitStatus('idle')}>
                          Try Again
                        </Button>
                        <a href={`tel:${CONTACT_INFO.phone.replace(/[^\d]/g, '')}`}>
                          <Button variant="primary" size="sm">
                            Call {CONTACT_INFO.phone}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Application Form */}
            {submitStatus !== 'success' && (
              <Card className="!border !border-green-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <CardBody className="p-6 md:p-8">
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    {/*
                      Honeypot. Positioned off-screen rather than display:none,
                      because some bots skip inputs they can tell are hidden.
                      Invisible and unreachable for people; anything typed here
                      means the submission was filled by a script.
                    */}
                    <div
                      aria-hidden="true"
                      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
                    >
                      <label htmlFor={HONEYPOT_FIELD}>Company website (leave this field empty)</label>
                      <input
                        type="text"
                        id={HONEYPOT_FIELD}
                        name={HONEYPOT_FIELD}
                        tabIndex={-1}
                        autoComplete="off"
                        defaultValue=""
                      />
                    </div>

                    {/* Personal Information */}
                    <div>
                      <h3 className="font-display text-xl font-bold text-black mb-4 pb-2 border-b-2 border-mauve">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="dealerName" className="block text-sm font-semibold text-black mb-2">
                            Your Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="dealerName"
                            name="dealerName"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="First and Last Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-semibold text-black mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="(555) 123-4567"
                          />
                          <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 text-sm text-black">
                              <input type="radio" name="phoneType" value="Cell" defaultChecked className="text-accent focus:ring-accent" />
                              Cell
                            </label>
                            <label className="flex items-center gap-2 text-sm text-black">
                              <input type="radio" name="phoneType" value="Home" className="text-accent focus:ring-accent" />
                              Home
                            </label>
                            <label className="flex items-center gap-2 text-sm text-black">
                              <input type="radio" name="phoneType" value="Other" className="text-accent focus:ring-accent" />
                              Other
                            </label>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="businessName" className="block text-sm font-semibold text-black mb-2">
                            Business Name <span className="text-sm text-gray-500">(if different)</span>
                          </label>
                          <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div>
                      <h3 className="font-display text-xl font-bold text-black mb-4 pb-2 border-b-2 border-mauve">
                        Business Information
                      </h3>
                      <div>
                        <label htmlFor="merchandiseType" className="block text-sm font-semibold text-black mb-2">
                          Type of Merchandise <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="merchandiseType"
                          name="merchandiseType"
                          required
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          placeholder="Describe the type of antiques/vintage items you plan to sell (e.g., mid-century modern furniture, vintage jewelry, advertising collectibles, etc.)"
                        />
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="font-display text-xl font-bold text-black mb-4 pb-2 border-b-2 border-mauve">
                        Experience
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            Are you new to the resale business? <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-black">
                              <input
                                type="radio"
                                name="newToResale"
                                value="Yes"
                                required
                                onChange={() => setShowExperience(false)}
                                className="text-accent focus:ring-accent"
                              />
                              Yes
                            </label>
                            <label className="flex items-center gap-2 text-black">
                              <input
                                type="radio"
                                name="newToResale"
                                value="No"
                                onChange={() => setShowExperience(true)}
                                className="text-accent focus:ring-accent"
                              />
                              No
                            </label>
                          </div>
                        </div>

                        {showExperience && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div>
                              <label htmlFor="yearsInIndustry" className="block text-sm font-semibold text-black mb-2">
                                How many years in the industry?
                              </label>
                              <input
                                type="number"
                                id="yearsInIndustry"
                                name="yearsInIndustry"
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                placeholder="e.g., 5"
                              />
                            </div>
                            <div>
                              <label htmlFor="previousMalls" className="block text-sm font-semibold text-black mb-2">
                                Previous Antique Mall Experience
                              </label>
                              <textarea
                                id="previousMalls"
                                name="previousMalls"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                placeholder="List previous malls, dates, and locations (optional)"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Space Requirements */}
                    <div>
                      <h3 className="font-display text-xl font-bold text-black mb-4 pb-2 border-b-2 border-mauve">
                        Space Requirements
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="spaceNeeded" className="block text-sm font-semibold text-black mb-2">
                            Space Size/Type Needed <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="spaceNeeded"
                            name="spaceNeeded"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                          >
                            <option value="">Select a booth size...</option>
                            <option value="8x8 Standard Booth ($200/mo)">8&apos; × 8&apos; Standard Booth ($200/mo)</option>
                            <option value="8x9 Medium Booth ($225-300/mo)">8&apos; × 9&apos; Medium Booth ($225-300/mo)</option>
                            <option value="8x13 Large Booth ($275-325/mo)">8&apos; × 13&apos; Large Booth ($275-325/mo)</option>
                            <option value="Display Case ($50-200/mo)">Display Case ($50-200/mo)</option>
                            <option value="Endcap Space ($25-35/mo)">Endcap Space ($25-35/mo)</option>
                            <option value="Multiple Spaces">Multiple Spaces</option>
                            <option value="Not Sure / Need Guidance">Not Sure / Need Guidance</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="moveInMonth" className="block text-sm font-semibold text-black mb-2">
                            Requested Move-In Month <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="moveInMonth"
                            name="moveInMonth"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                          >
                            <option value="">Select a month...</option>
                            {(() => {
                              const months = []
                              const currentDate = new Date()
                              const currentYear = currentDate.getFullYear()
                              const currentMonth = currentDate.getMonth()

                              // Generate next 12 months
                              for (let i = 0; i < 12; i++) {
                                const date = new Date(currentYear, currentMonth + i, 1)
                                const year = date.getFullYear()
                                const month = date.getMonth()
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                                   'July', 'August', 'September', 'October', 'November', 'December']
                                const value = `${year}-${String(month + 1).padStart(2, '0')}`
                                const label = `${monthNames[month]} ${year}`
                                months.push(<option key={value} value={value}>{label}</option>)
                              }
                              return months
                            })()}
                          </select>
                        </div>
                      </div>
                    </div>


                    {/* Additional Comments */}
                    <div>
                      <label htmlFor="additionalComments" className="block text-sm font-semibold text-black mb-2">
                        Additional Comments or Questions
                      </label>
                      <textarea
                        id="additionalComments"
                        name="additionalComments"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Anything else you'd like us to know about your business or application? (optional)"
                      />
                    </div>

                    {/* Terms */}
                    <div className="bg-slate-light/20 rounded-lg p-4 space-y-3">
                      <label className="flex items-start gap-3 text-sm text-black cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          className="mt-1 text-accent focus:ring-accent rounded"
                        />
                        <span>
                          I understand that this is an application and does not guarantee booth space availability.
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm text-black cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          className="mt-1 text-accent focus:ring-accent rounded"
                        />
                        <span>
                          I have read and agree to the lease terms outlined on this page.
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                      <Button
                        type="button"
                        variant="accent"
                        size="lg"
                        onClick={() => formRef.current?.reset()}
                        disabled={isSubmitting}
                      >
                        Clear Form
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          'Submit Application'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}
          </motion.div>

          {/* Contact CTA */}
          <div className="mt-12 text-center p-8 bg-gradient-to-r from-slate-light/20 to-mauve-light/20 rounded-lg border-2 border-slate-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer">
            <h3 className="font-display text-2xl font-bold text-black mb-3">
              Questions About Becoming a Vendor?
            </h3>
            <p className="text-black mb-6 max-w-2xl mx-auto">
              We&apos;re here to help! Call us or send an email - we&apos;d love to discuss how you can join our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`tel:${CONTACT_INFO.phone.replace(/[^\d]/g, '')}`}>
                <Button variant="primary" size="lg" className="!border-2 !border-slate-500">
                  Call {CONTACT_INFO.phone}
                </Button>
              </a>
              <a href="mailto:contactus@mariettaantiquemall.com">
                <Button variant="accent" size="lg" className="!border-2 !border-slate-500">
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
