-- Seed data: Western Sydney golf courses

-- Glenmore Heritage (Mulgoa)  
-- Course Rating 74.1, Slope 142, Par 72 

-- Wallacia Golf & Country Club 
-- Blue tees, Men: Course Rating 70.2, Slope 120, Par 71

with course as (
  insert into courses (name, location) values
    ('Wallacia Golf & Country Club', 'Park Road, Wallacia, NSW 2745')
  returning id
), tee as (
  insert into tee_sets (course_id, name, course_rating, slope_rating, par)
  select id, 'Blue', 70.2, 120, 71 from course
  returning id
)
insert into holes (tee_set_id, hole_number, par, stroke_index)
select id, hole_number, par, stroke_index
from tee, (values
  (1, 4, 3), (2, 4, 5), (3, 4, 9), (4, 3, 11), (5, 4, 7),
  (6, 3, 13), (7, 4, 17), (8, 4, 1), (9, 4, 15),
  (10, 5, 4), (11, 4, 14), (12, 4, 10), (13, 5, 2), (14, 3, 6),
  (15, 4, 18), (16, 5, 12), (17, 3, 16), (18, 4, 8)
) as h(hole_number, par, stroke_index);

-- Dunheved Golf Club
-- Blue tees, Men: Course Rating 72.1, Slope 134, Par 72

with course as (
  insert into courses (name, location) values
    ('Dunheved Golf Club', '176 Links Road, St Marys, NSW 2760')
  returning id
), tee as (
  insert into tee_sets (course_id, name, course_rating, slope_rating, par)
  select id, 'Blue', 72.1, 134, 72 from course
  returning id
)
insert into holes (tee_set_id, hole_number, par, stroke_index)
select id, hole_number, par, stroke_index
from tee, (values
  (1, 4, 12), (2, 5, 17), (3, 4, 6), (4, 3, 4), (5, 5, 11),
  (6, 4, 3), (7, 4, 16), (8, 3, 9), (9, 4, 1),
  (10, 4, 2), (11, 3, 8), (12, 5, 13), (13, 3, 15), (14, 4, 14),
  (15, 5, 18), (16, 5, 10), (17, 3, 7), (18, 4, 5)
) as h(hole_number, par, stroke_index);


-- Springwood Country Club
-- White tees, Men: Course Rating 68.9, Slope 124, Par 69
with course as (
  insert into courses (name, location) values
    ('Springwood Country Club', '84 Hawkesbury Road, Springwood, NSW 2777')
  returning id
), tee as (
  insert into tee_sets (course_id, name, course_rating, slope_rating, par)
  select id, 'White', 68.9, 124, 69 from course
  returning id
)
insert into holes (tee_set_id, hole_number, par, stroke_index)
select id, hole_number, par, stroke_index
from tee, (values
  (1, 4, 1), (2, 5, 5), (3, 3, 7), (4, 4, 17), (5, 4, 3),
  (6, 3, 13), (7, 4, 9), (8, 3, 11), (9, 4, 15),
  (10, 4, 18), (11, 4, 10), (12, 4, 16), (13, 3, 4), (14, 4, 2),
  (15, 5, 12), (16, 4, 8), (17, 4, 6), (18, 3, 14)
) as h(hole_number, par, stroke_index);
