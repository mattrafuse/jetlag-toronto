import type { MeasuringQuestionDef, RadarQuestionDef, ThermometerQuestionDef } from "./types";

// ── Radar Questions ────────────────────────────────────────────
// Format: "Are you within ____ of me?" — Yes/No answer
// Cost: hider draws 2 cards, keeps 1
export const radarQuestions: RadarQuestionDef[] = [
  { type: "radar", distance: 0.25, label: "¼ Mile" },
  { type: "radar", distance: 0.5, label: "½ Mile" },
  { type: "radar", distance: 1, label: "1 Mile" },
  { type: "radar", distance: 3, label: "3 Miles" },
  { type: "radar", distance: 5, label: "5 Miles" },
  { type: "radar", distance: 10, label: "10 Miles" },
];

// ── Thermometer Questions ──────────────────────────────────────
// Format: "After traveling ____, am I hotter or colder?"
// Cost: hider draws 2 cards, keeps 1
export const thermometerQuestions: ThermometerQuestionDef[] = [
  { type: "thermometer", distance: 0.5, label: "½ Mile", gameSize: "small" },
  { type: "thermometer", distance: 3, label: "3 Miles", gameSize: "small" },
  { type: "thermometer", distance: 10, label: "10 Miles", gameSize: "medium" },
  { type: "thermometer", distance: 50, label: "50 Miles", gameSize: "large" },
];

// ── Measuring Questions ────────────────────────────────────────
// Format: "Compared to me, are you closer to or further from ____?"
// Cost: hider draws 3 cards, keeps 1
// Parsed from https://www.lifack.ch/docs/seeking/measuring_questions
export const measuringQuestions: MeasuringQuestionDef[] = [
  // Transit-Related
  {
    type: "measuring",
    category: "Transit-Related",
    noun: "Commercial Airport",
    description:
      "If there is any ambiguity, an airport is considered commercial if you can view flights to/from it via Google Flights.",
  },
  {
    type: "measuring",
    category: "Transit-Related",
    noun: "High-Speed Train Line",
    description:
      "EU definition: Minimum speed of 250 km/h (155 mph) on lines specifically built for high speed rail and of about 200 km/h (124 mph) on existing lines which have been specifically upgraded.",
  },
  {
    type: "measuring",
    category: "Transit-Related",
    noun: "Rail Station",
    description: "Includes light and heavy rail; metros/subways count.",
  },

  // Borders
  {
    type: "measuring",
    category: "Borders",
    noun: "International Border",
    description: "Enclaves count!",
  },
  {
    type: "measuring",
    category: "Borders",
    noun: "1st Administrative Division Border",
    description:
      "Border between the biggest formal category of division. For the US: states. Switzerland: cantons. Japan: prefectures.",
  },
  {
    type: "measuring",
    category: "Borders",
    noun: "2nd Administrative Division Border",
    description:
      "Border between the next level of division. US: counties. Switzerland: districts. Japan: subprefectures.",
  },

  // Natural
  {
    type: "measuring",
    category: "Natural",
    noun: "Sea Level",
    description:
      "Refers to a player's altitude. Find using your phone's compass. Warning: compass can be wrong.",
  },
  {
    type: "measuring",
    category: "Natural",
    noun: "Body of Water",
    description: "Any named body of water on your maps app, excluding pools.",
  },
  {
    type: "measuring",
    category: "Natural",
    noun: "Coastline",
    description:
      "Any place where land meets either the ocean, a great lake, or a body of water that flows directly into the ocean or great lake via a waterway that is never less than 1 mile across.",
  },
  {
    type: "measuring",
    category: "Natural",
    noun: "Mountain",
    description:
      "Anything correctly classified as a mountain by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Natural",
    noun: "Park",
    description:
      "Anything correctly classified as a park by your mapping app. Measure distance from the map icon.",
  },

  // Places of Interest
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Amusement Park",
    description:
      "Anything correctly categorized as an amusement park by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Zoo",
    description:
      "Anything correctly categorized as a zoo by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Aquarium",
    description:
      "Anything correctly categorized as an aquarium by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Golf Course",
    description:
      "An outdoor golf course. Miniature golf does not count. Driving ranges do not count. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Museum",
    description:
      "Anything correctly categorized as a museum by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Places of Interest",
    noun: "Movie Theater",
    description:
      "Anything correctly categorized as a movie theater by your mapping app. Measure distance from the map icon.",
  },

  // Public Utilities
  {
    type: "measuring",
    category: "Public Utilities",
    noun: "Hospital",
    description:
      "Anything correctly categorized as a hospital by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Public Utilities",
    noun: "Library",
    description:
      "Anything correctly categorized as a library by your mapping app. Measure distance from the map icon.",
  },
  {
    type: "measuring",
    category: "Public Utilities",
    noun: "Foreign Consulate",
    description:
      "Anything correctly categorized as a foreign consulate by your mapping app. Exclude honorary consulates. Measure distance from the map icon.",
  },
];
