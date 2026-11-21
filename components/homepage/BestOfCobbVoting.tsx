'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function BestOfCobbVoting() {
  const [isVotingPeriod, setIsVotingPeriod] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if current date is within voting period
    const now = new Date()
    const votingStart = new Date('2024-12-01') // Contest is active now
    const votingEnd = new Date('2026-01-07') // Deadline from user

    setIsVotingPeriod(now >= votingStart && now <= votingEnd)
  }, [])

  const handleVoteClick = () => {
    // Track the click event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'award_vote_click', {
        link_location: 'home_best_of_cobb',
      })
    }

    window.open('https://www.mdjonline.com/cobblife/bestof/#//', '_blank')
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return null
  }

  // Only render during voting period
  if (!isVotingPeriod) {
    return null
  }

  return (
    <section className="section-padding bg-gradient-to-b from-white to-slate-light/50">
      <style jsx global>{`
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
            rgba(239, 195, 147, 1) 50%,
            rgba(0, 0, 0, 1) 60%,
            rgba(0, 0, 0, 1) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      <div className="container-custom">
        <Card className="!border-[3px] !border-mauve max-w-2xl mx-auto text-center !p-6 md:!p-8">
          <h2 className="shimmer-text font-display text-2xl md:text-3xl font-bold mb-4">
            Vote for Us - Best of Cobb 2026!
          </h2>

          <p className="text-base md:text-lg text-black mb-6 max-w-xl mx-auto">
            Help us win Best Antique Store! Vote daily through January 7th, 2026.
          </p>

          {/* Flyer Image */}
          <div className="relative w-full max-w-md mx-auto mb-6">
            <div className="relative w-full rounded-lg overflow-hidden shadow-lg border-2 border-mauve">
              <Image
                src="/images/Mall-vote.png"
                alt="Vote for Marietta Antique Mall - Best of Cobb 2026"
                width={1080}
                height={1080}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Vote Button */}
          <div className="flex flex-col items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleVoteClick}
              className="w-full sm:w-auto sm:min-w-[280px] !bg-accent !text-black !border-2 !border-accent hover:!bg-accent-dark hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Vote Now!
            </Button>

            <p className="text-sm text-black/60">
              Vote daily • Every vote counts!
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
