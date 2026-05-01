export interface HistoricalEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  coordinates: { lat: number; lng: number };
  conditions: {
    wind: {
      speed: number;
      direction: number;
      gust: number;
      beaufort: number;
    };
    waves: {
      height: number;
      period: number;
      direction: number;
      primarySwell: {
        height: number;
        period: number;
        direction: number;
        steepness: number;
      };
      secondarySwell: {
        height: number;
        period: number;
        direction: number;
        steepness: number;
      };
      seaState: string;
      confusedSea: boolean;
      swellAngle: number;
    };
    tides: {
      height: number;
      nextHigh: string;
      nextLow: string;
      flow: 'ebb' | 'flood' | 'slack';
    };
    weather: {
      temperature: number;
      visibility: number;
      cloudCover: number;
      precipitation: number;
      pressure: number;
      humidity: number;
      description: string;
    };
    safetyRating: 'safe' | 'caution' | 'danger';
  };
  historicalNote: string;
  casualties?: string;
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'fastnet-1979',
    name: 'Fastnet Race Storm 1979',
    date: '1979-08-13',
    location: 'Celtic Sea, SW of Fastnet Rock',
    description:
      'The worst disaster in offshore racing history. A Force 11 storm struck the 303-boat fleet between Ireland and Cornwall during the Fastnet Race.',
    coordinates: { lat: 51.37, lng: -9.6 },
    conditions: {
      wind: {
        speed: 55, // knots — Force 10-11
        direction: 240, // SW storm
        gust: 70, // gusts to Force 12
        beaufort: 11,
      },
      waves: {
        height: 13.5, // 12-14 metre storm waves
        period: 11, // steep, breaking waves
        direction: 245,
        primarySwell: {
          height: 9.0, // Atlantic swell
          period: 13,
          direction: 260,
          steepness: 0.45,
        },
        secondarySwell: {
          height: 6.5, // storm waves crossing Atlantic swell
          period: 8,
          direction: 215,
          steepness: 0.52,
        },
        seaState: 'phenomenal',
        confusedSea: true, // crossing swells caused chaotic seas
        swellAngle: 45, // 45 degree angle between swells
      },
      tides: {
        height: 2.1,
        nextHigh: '1979-08-14T02:15:00.000Z',
        nextLow: '1979-08-13T20:30:00.000Z',
        flow: 'ebb', // ebb tide opposing storm — made seas worse
      },
      weather: {
        temperature: 13,
        visibility: 0.5, // near zero in driving rain
        cloudCover: 100,
        precipitation: 25, // heavy rain
        pressure: 966, // deep depression
        humidity: 98,
        description:
          'Violent storm — Force 11. Rapidly deepening depression crossed Celtic Sea overnight. Catastrophic conditions for sailing.',
      },
      safetyRating: 'danger',
    },
    historicalNote:
      'On the night of 13-14 August 1979, a Force 10-11 storm struck 303 yachts racing from Cowes to the Fastnet Rock. 5 yachts sank, 15 sailors died, and 136 crew were rescued. Only 85 of 303 boats finished the race. It remains the deadliest peacetime sailing disaster in British waters.',
    casualties: '15 deaths, 5 yachts sunk, 136 rescued',
  },
  {
    id: 'sydney-hobart-1998',
    name: 'Sydney to Hobart Storm 1998',
    date: '1998-12-27',
    location: 'Bass Strait, Australia',
    description:
      "A catastrophic storm in Bass Strait during the Sydney to Hobart yacht race. The worst disaster in the race's history.",
    coordinates: { lat: -40.5, lng: 147.5 },
    conditions: {
      wind: {
        speed: 60,
        direction: 180,
        gust: 80,
        beaufort: 12,
      },
      waves: {
        height: 20,
        period: 12,
        direction: 185,
        primarySwell: {
          height: 14,
          period: 14,
          direction: 190,
          steepness: 0.55,
        },
        secondarySwell: {
          height: 9,
          period: 9,
          direction: 145,
          steepness: 0.48,
        },
        seaState: 'phenomenal',
        confusedSea: true,
        swellAngle: 45,
      },
      tides: {
        height: 1.8,
        nextHigh: '1998-12-27T08:00:00.000Z',
        nextLow: '1998-12-27T14:00:00.000Z',
        flow: 'ebb',
      },
      weather: {
        temperature: 15,
        visibility: 0.2,
        cloudCover: 100,
        precipitation: 30,
        pressure: 958,
        humidity: 99,
        description:
          'Hurricane force winds. Bomb cyclone rapidly deepened over Bass Strait. Catastrophic seas with breaking waves up to 20 metres.',
      },
      safetyRating: 'danger',
    },
    historicalNote:
      'A rapidly deepening low pressure system (bomb cyclone) hit 115 boats in Bass Strait. 6 sailors died, 5 yachts sank, 55 sailors were rescued in one of the largest peacetime rescues in Australian history. Only 44 of 115 boats finished.',
    casualties: '6 deaths, 5 yachts sunk, 55 rescued',
  },
  {
    id: 'rolex-middle-sea-2007',
    name: 'Rolex Middle Sea Race Storm 2007',
    date: '2007-10-21',
    location: 'Mediterranean Sea, Malta',
    description: 'A sudden Mediterranean storm caught the fleet during the Rolex Middle Sea Race.',
    coordinates: { lat: 35.9, lng: 14.5 },
    conditions: {
      wind: {
        speed: 42,
        direction: 320,
        gust: 55,
        beaufort: 9,
      },
      waves: {
        height: 6.5,
        period: 8,
        direction: 315,
        primarySwell: {
          height: 4.5,
          period: 9,
          direction: 320,
          steepness: 0.32,
        },
        secondarySwell: {
          height: 3.0,
          period: 6,
          direction: 270,
          steepness: 0.28,
        },
        seaState: 'very-rough',
        confusedSea: true,
        swellAngle: 50,
      },
      tides: {
        height: 0.3,
        nextHigh: '2007-10-21T12:00:00.000Z',
        nextLow: '2007-10-21T18:00:00.000Z',
        flow: 'slack',
      },
      weather: {
        temperature: 18,
        visibility: 1.0,
        cloudCover: 95,
        precipitation: 15,
        pressure: 982,
        humidity: 90,
        description:
          'Severe Mediterranean mistral. Short steep seas typical of enclosed waters. Rapid deterioration with little warning.',
      },
      safetyRating: 'danger',
    },
    historicalNote:
      'A classic Mediterranean weather bomb struck the fleet. The enclosed sea creates short, steep, breaking waves more dangerous than ocean swells of the same height.',
    casualties: 'Several boats dismasted, no fatalities',
  },
];

export function getHistoricalEvent(id: string): HistoricalEvent | undefined {
  return HISTORICAL_EVENTS.find((e) => e.id === id);
}
