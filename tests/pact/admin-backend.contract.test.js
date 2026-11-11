/**
 * Pact Contract Tests: Admin Dashboard ↔ Backend API
 *
 * These tests ensure the Admin dashboard sends valid recommendation data
 * that the Backend and iOS app can process.
 */

const { describe, test, expect } = require('@jest/globals');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load schemas
const recommendationSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/recommendation.schema.json'), 'utf8')
);

const commonTypesSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/common-types.schema.json'), 'utf8')
);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

ajv.addSchema(commonTypesSchema, 'common-types.schema.json');
const validateRecommendation = ajv.compile(recommendationSchema);

describe('Admin → Backend Contract: Recommendation Creation', () => {
  test('Admin sends valid minimal recommendation', () => {
    const adminRecommendation = {
      id: 'rec-123',
      tripOverview: 'Perfect Paris getaway',
      destinations: [
        {
          id: 'dest-1',
          cityName: 'Paris',
          arrivalDate: '2026-06-15',
          departureDate: '2026-06-22',
          numberOfNights: 7
        }
      ],
      logistics: {
        transportSegments: [],
        bookingDeadlines: [],
        generalInstructions: ''
      },
      totalCost: {
        totalEstimate: 5000,
        flights: 2000,
        accommodation: 2000,
        activities: 0,
        food: 500,
        localTransport: 300,
        miscellaneous: 200,
        currency: 'USD'
      },
      _schemaVersion: '2.0.0'
    };

    const valid = validateRecommendation(adminRecommendation);
    if (!valid) {
      console.error('Validation errors:', JSON.stringify(validateRecommendation.errors, null, 2));
    }
    expect(valid).toBe(true);
  });

  test('Admin sends comprehensive recommendation', () => {
    const adminRecommendation = {
      id: 'rec-456',
      tripOverview: 'Luxurious French Riviera tour',
      destinations: [
        {
          id: 'dest-1',
          cityName: 'Nice',
          arrivalDate: '2026-06-15',
          departureDate: '2026-06-20',
          numberOfNights: 5,
          overview: 'Beach relaxation and French cuisine',
          accommodationOptions: [
            {
              id: 'acc-1',
              priority: 1,
              hotel: {
                name: 'Hotel Negresco',
                rating: 5,
                pricePerNight: 400,
                location: 'Promenade des Anglais',
                bookingUrl: 'https://booking.com/hotel-negresco'
              }
            }
          ],
          recommendedActivities: [
            {
              id: 'act-1',
              name: 'Old Town Walking Tour',
              description: 'Explore historic Nice',
              location: 'Old Town',
              estimatedCost: 25,
              estimatedDuration: '3 hours',
              category: 'Culture'
            }
          ],
          recommendedRestaurants: [
            {
              id: 'rest-1',
              name: 'Le Chantecler',
              cuisine: 'French',
              location: 'Hotel Negresco',
              priceRange: '$$$$',
              description: 'Michelin-starred dining'
            }
          ]
        }
      ],
      logistics: {
        transportSegments: [
          {
            id: 'seg-1',
            fromCity: 'New York',
            toCity: 'Nice',
            departureDate: '2026-06-15',
            segmentType: 'outbound',
            transportOptions: []
          }
        ],
        bookingDeadlines: [],
        generalInstructions: 'Arrive at airport 3 hours early'
      },
      totalCost: {
        totalEstimate: 10000,
        flights: 2000,
        accommodation: 4000,
        activities: 500,
        food: 2500,
        localTransport: 500,
        miscellaneous: 500,
        currency: 'USD'
      },
      specialNotes: 'Book restaurants in advance',
      _schemaVersion: '2.0.0',
      _lastModifiedBy: 'admin_dashboard'
    };

    const valid = validateRecommendation(adminRecommendation);
    if (!valid) {
      console.error('Validation errors:', JSON.stringify(validateRecommendation.errors, null, 2));
    }
    expect(valid).toBe(true);
  });

  test('Admin & AI Copilot send rich points-and-cash recommendation with nested flight details', () => {
    const richAdminRecommendation = {
      id: 'rec-points-789',
      tripOverview: 'Paris & London Business Class Points Strategy',
      costNotes: 'Transfer 100k Chase Ultimate Rewards to Air France Flying Blue and 135k Chase UR to World of Hyatt.',
      destinations: [
        {
          id: 'dest-paris',
          cityName: 'Paris',
          arrivalDate: '2026-05-12',
          departureDate: '2026-05-15',
          numberOfNights: 3,
          overview: '3 nights in central Paris near Place Vendôme.',
          accommodationOptions: [
            {
              id: 'acc-hyatt',
              priority: 1,
              selectedOption: true,
              bookingInstructions: 'Transfer 135,000 Chase UR points to Hyatt and book Standard Suite or King Bed.',
              totalCost: {
                paymentType: 'points',
                cashAmount: 0,
                pointsAmount: 135000,
                pointsProgram: 'World of Hyatt'
              },
              hotel: {
                name: 'Park Hyatt Paris-Vendôme',
                rating: 5,
                pricePerNight: 0,
                pointsPerNight: 45000,
                loyaltyProgram: 'World of Hyatt',
                location: '5 Rue de la Paix, 75002 Paris, France',
                bookingUrl: '',
                bookingInstructions: 'Book directly on hyatt.com after instant Chase transfer.',
                detailedDescription: 'Five-star palace hotel in the heart of Paris.',
                amenities: ['Spa', 'Concierge', 'Globalist Breakfast'],
                cancellationPolicy: 'Free cancellation up to 48 hours prior',
                photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
              }
            }
          ],
          recommendedActivities: [
            {
              id: 'act-louvre',
              name: 'Musée du Louvre Evening Tour',
              description: 'Private or small-group evening tour',
              location: { name: 'Louvre Museum', address: 'Rue de Rivoli, 75001 Paris' },
              estimatedCost: { paymentType: 'cash', cashAmount: 65 },
              estimatedDuration: '3 hours',
              category: 'Cultural',
              priority: 1,
              bestTimeToVisit: 'Wednesday or Friday evening',
              bookingRequired: true,
              bookingInstructions: 'Book timed entry 60 days out',
              tips: 'Enter via Carrousel du Louvre underground entrance to skip the Pyramid line.',
              website: 'https://www.louvre.fr',
              tripadvisorUrl: ''
            }
          ],
          recommendedRestaurants: [
            {
              id: 'rest-comptoir',
              name: 'Le Comptoir du Relais',
              cuisine: 'French Bistro',
              mealType: 'Dinner',
              priority: 1,
              location: { name: 'Saint-Germain-des-Prés', address: '9 Carrefour de l\'Odéon, 75006 Paris' },
              priceRange: '$$$',
              estimatedCost: { paymentType: 'cash', cashAmount: 140 },
              description: 'Classic Saint-Germain bistro by Yves Camdeborde.',
              reservationRequired: false,
              reservationUrl: '',
              reservationInstructions: 'Walk-ins for dinner; arrive by 6:45 PM.',
              specialties: 'Duck confit, terrine de campagne',
              tips: 'Ask for a sidewalk table if weather is warm.',
              yelpUrl: ''
            }
          ]
        }
      ],
      logistics: {
        transportSegments: [
          {
            id: 'seg-outbound',
            fromCity: 'New York (JFK)',
            toCity: 'Paris (CDG)',
            departureDate: '2026-05-11',
            transportOptions: [
              {
                id: 'opt-af11',
                transportType: 'flight',
                priority: 1,
                duration: '7h 15m',
                bookingUrl: 'https://wwws.airfrance.us',
                notes: 'Transfer Chase UR or Amex MR to Flying Blue.',
                isRoundTrip: false,
                recommendedSelection: true,
                cost: {
                  paymentType: 'hybrid',
                  cashAmount: 210,
                  totalCashValue: 210,
                  pointsAmount: 50000,
                  pointsProgram: 'Air France Flying Blue'
                },
                details: {
                  flightNumber: 'AF 11',
                  airline: 'Air France',
                  departureAirportName: 'John F. Kennedy International Airport',
                  arrivalAirportName: 'Charles de Gaulle Airport',
                  class: 'Business',
                  aircraft: 'Boeing 777-300ER',
                  details: {
                    departure: {
                      airportCode: 'JFK',
                      time: '19:30',
                      date: '2026-05-11'
                    },
                    arrival: {
                      airportCode: 'CDG',
                      time: '08:45',
                      date: '2026-05-12'
                    },
                    route: 'JFK → CDG',
                    showDateChange: '+1 day'
                  }
                }
              }
            ]
          }
        ],
        bookingDeadlines: [],
        generalInstructions: 'Check Flying Blue award space before transferring points.'
      },
      totalCost: {
        totalEstimate: 415,
        flights: 210,
        accommodation: 0,
        activities: 65,
        food: 140,
        localTransport: 0,
        miscellaneous: 0,
        currency: 'USD',
        pointsUsed: {
          'Air France Flying Blue': 50000,
          'World of Hyatt': 135000
        }
      },
      _schemaVersion: '2.1.0',
      _lastModifiedBy: 'ai_copilot'
    };

    const valid = validateRecommendation(richAdminRecommendation);
    if (!valid) {
      console.error('Validation errors:', JSON.stringify(validateRecommendation.errors, null, 2));
    }
    expect(valid).toBe(true);
  });
});

describe('Admin → Backend Contract: Invalid Recommendations', () => {
  test('Backend rejects recommendation with missing required fields', () => {
    const invalidRecommendation = {
      id: 'rec-789',
      // Missing tripOverview
      destinations: [],
      // Missing totalCost
    };

    const valid = validateRecommendation(invalidRecommendation);
    expect(valid).toBe(false);
    expect(validateRecommendation.errors).toBeDefined();
  });

  test('Backend rejects recommendation with invalid URL', () => {
    const invalidRecommendation = {
      id: 'rec-999',
      tripOverview: 'Test trip',
      destinations: [
        {
          id: 'dest-1',
          cityName: 'Paris',
          arrivalDate: '2026-06-15',
          departureDate: '2026-06-22',
          numberOfNights: 7,
          accommodationOptions: [
            {
              id: 'acc-1',
              priority: 1,
              hotel: {
                name: 'Test Hotel',
                rating: 4,
                location: 'Paris',
                bookingUrl: 'not-a-valid-url'  // INVALID URL
              }
            }
          ]
        }
      ],
      totalCost: {
        totalEstimate: 5000,
        currency: 'USD'
      }
    };

    const valid = validateRecommendation(invalidRecommendation);
    expect(valid).toBe(false);
  });

  test('Backend rejects recommendation with invalid currency code', () => {
    const invalidRecommendation = {
      id: 'rec-888',
      tripOverview: 'Test trip',
      destinations: [
        {
          id: 'dest-1',
          cityName: 'Paris',
          arrivalDate: '2026-06-15',
          departureDate: '2026-06-22',
          numberOfNights: 7
        }
      ],
      totalCost: {
        totalEstimate: 5000,
        currency: 'DOLLARS'  // INVALID: Should be 3-letter code like 'USD'
      }
    };

    const valid = validateRecommendation(invalidRecommendation);
    expect(valid).toBe(false);
  });

  test('Backend rejects accommodation with invalid rating', () => {
    const invalidRecommendation = {
      id: 'rec-777',
      tripOverview: 'Test trip',
      destinations: [
        {
          id: 'dest-1',
          cityName: 'Paris',
          arrivalDate: '2026-06-15',
          departureDate: '2026-06-22',
          numberOfNights: 7,
          accommodationOptions: [
            {
              id: 'acc-1',
              priority: 1,
              hotel: {
                name: 'Test Hotel',
                rating: 6,  // INVALID: Max is 5
                location: 'Paris'
              }
            }
          ]
        }
      ],
      totalCost: {
        totalEstimate: 5000,
        currency: 'USD'
      }
    };

    const valid = validateRecommendation(invalidRecommendation);
    expect(valid).toBe(false);
  });
});
