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
      totalCost: {
        totalEstimate: 5000,
        currency: 'USD'
      }
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
      specialNotes: 'Book restaurants in advance'
    };

    const valid = validateRecommendation(adminRecommendation);
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
