export interface Course {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface TeeSet {
  id: string;
  course_id: string;
  name: string;
  course_rating: number;
  slope_rating: number;
  par: number;
  front_course_rating: number | null;
  front_slope_rating: number | null;
  back_course_rating: number | null;
  back_slope_rating: number | null;
  created_at: string;
}

export interface Hole {
  id: string;
  tee_set_id: string;
  hole_number: number;
  par: number;
  stroke_index: number;
  yardage_meters: number | null;
}

export interface TeeSetWithHoles extends TeeSet {
  holes: Hole[];
}

export interface CourseWithTeeSets extends Course {
  tee_sets: TeeSet[];
}

export interface RoundHole {
  id: string;
  round_id: string;
  hole_number: number;
  par: number;
  gross_score: number;
  net_double_bogey_cap: number;
  adjusted_score: number;
  putts: number | null;
}

export interface Round {
  id: string;
  user_id: string;
  tee_set_id: string;
  date_played: string;
  handicap_index_at_time: number | null;
  course_handicap: number;
  total_gross_score: number;
  adjusted_gross_score: number;
  score_differential: number;
  is_exceptional: boolean;
  notes: string | null;
  holes_played: 9 | 18;
  nine_played: "front" | "back" | null;
  raw_nine_hole_differential: number | null;
  created_at: string;
}

export interface RoundWithDetails extends Round {
  round_holes: RoundHole[];
  tee_set: TeeSet & { course: Course };
}

export interface NewRoundInput {
  teeSetId: string;
  datePlayed: string;
  notes: string;
  holesPlayed: 9 | 18;
  ninePlayed: "front" | "back" | null;
  holeScores: { holeNumber: number; grossScore: number; putts: number | null }[];
}

export interface NewCourseInput {
  name: string;
  location: string;
  teeSets: {
    name: string;
    courseRating: number;
    slopeRating: number;
    par: number;
    frontCourseRating: number | null;
    frontSlopeRating: number | null;
    backCourseRating: number | null;
    backSlopeRating: number | null;
    holes: {
      holeNumber: number;
      par: number;
      strokeIndex: number;
      yardageMeters: number | null;
    }[];
  }[];
}

export interface ClubDistance {
  id: string;
  user_id: string;
  club_name: string;
  typical_distance_meters: number;
  sort_order: number;
  created_at: string;
}

export interface NewClubDistanceInput {
  clubName: string;
  typicalDistanceMeters: number;
}
