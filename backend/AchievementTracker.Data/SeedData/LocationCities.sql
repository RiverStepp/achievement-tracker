SET NOCOUNT ON;

INSERT INTO LocationCities (LocationStateRegionId, Name)
SELECT s.LocationStateRegionId, v.City
FROM LocationStateRegions s
INNER JOIN LocationCountries c ON c.LocationCountryId = s.LocationCountryId
CROSS JOIN (VALUES
  (N'US-AK', N'Juneau'),
  (N'US-AL', N'Montgomery'),
  (N'US-AR', N'Little Rock'),
  (N'US-AZ', N'Phoenix'),
  (N'US-CA', N'Sacramento'),
  (N'US-CO', N'Denver'),
  (N'US-CT', N'Hartford'),
  (N'US-DC', N'Washington'),
  (N'US-DE', N'Dover'),
  (N'US-FL', N'Tallahassee'),
  (N'US-GA', N'Atlanta'),
  (N'US-HI', N'Honolulu'),
  (N'US-IA', N'Des Moines'),
  (N'US-ID', N'Boise'),
  (N'US-IL', N'Springfield'),
  (N'US-IN', N'Indianapolis'),
  (N'US-KS', N'Topeka'),
  (N'US-KY', N'Frankfort'),
  (N'US-LA', N'Baton Rouge'),
  (N'US-MA', N'Boston'),
  (N'US-MD', N'Annapolis'),
  (N'US-ME', N'Augusta'),
  (N'US-MI', N'Lansing'),
  (N'US-MN', N'Saint Paul'),
  (N'US-MO', N'Jefferson City'),
  (N'US-MS', N'Jackson'),
  (N'US-MT', N'Helena'),
  (N'US-NC', N'Raleigh'),
  (N'US-ND', N'Bismarck'),
  (N'US-NE', N'Lincoln'),
  (N'US-NH', N'Concord'),
  (N'US-NJ', N'Trenton'),
  (N'US-NM', N'Santa Fe'),
  (N'US-NV', N'Carson City'),
  (N'US-NY', N'Albany'),
  (N'US-OH', N'Columbus'),
  (N'US-OK', N'Oklahoma City'),
  (N'US-OR', N'Salem'),
  (N'US-PA', N'Harrisburg'),
  (N'US-RI', N'Providence'),
  (N'US-SC', N'Columbia'),
  (N'US-SD', N'Pierre'),
  (N'US-TN', N'Nashville'),
  (N'US-TX', N'Austin'),
  (N'US-UT', N'Salt Lake City'),
  (N'US-VA', N'Richmond'),
  (N'US-VT', N'Montpelier'),
  (N'US-WA', N'Olympia'),
  (N'US-WI', N'Madison'),
  (N'US-WV', N'Charleston'),
  (N'US-WY', N'Cheyenne')
) v(Code, City)
WHERE s.Code = v.Code AND c.IsoAlpha2 = N'US'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationCities x WHERE x.LocationStateRegionId = s.LocationStateRegionId AND x.Name = v.City);

INSERT INTO LocationCities (LocationStateRegionId, Name)
SELECT s.LocationStateRegionId, v.City
FROM LocationStateRegions s
INNER JOIN LocationCountries c ON c.LocationCountryId = s.LocationCountryId
CROSS JOIN (VALUES
  (N'CA-AB', N'Edmonton'),
  (N'CA-BC', N'Victoria'),
  (N'CA-MB', N'Winnipeg'),
  (N'CA-NB', N'Fredericton'),
  (N'CA-NL', N'St. John''s'),
  (N'CA-NS', N'Halifax'),
  (N'CA-NT', N'Yellowknife'),
  (N'CA-NU', N'Iqaluit'),
  (N'CA-ON', N'Toronto'),
  (N'CA-PE', N'Charlottetown'),
  (N'CA-QC', N'Quebec City'),
  (N'CA-SK', N'Regina'),
  (N'CA-YT', N'Whitehorse')
) v(Code, City)
WHERE s.Code = v.Code AND c.IsoAlpha2 = N'CA'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationCities x WHERE x.LocationStateRegionId = s.LocationStateRegionId AND x.Name = v.City);

INSERT INTO LocationCities (LocationStateRegionId, Name)
SELECT s.LocationStateRegionId, v.City
FROM LocationStateRegions s
INNER JOIN LocationCountries c ON c.LocationCountryId = s.LocationCountryId
CROSS JOIN (VALUES
  (N'AU-ACT', N'Canberra'),
  (N'AU-NSW', N'Sydney'),
  (N'AU-NT', N'Darwin'),
  (N'AU-QLD', N'Brisbane'),
  (N'AU-SA', N'Adelaide'),
  (N'AU-TAS', N'Hobart'),
  (N'AU-VIC', N'Melbourne'),
  (N'AU-WA', N'Perth')
) v(Code, City)
WHERE s.Code = v.Code AND c.IsoAlpha2 = N'AU'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationCities x WHERE x.LocationStateRegionId = s.LocationStateRegionId AND x.Name = v.City);

INSERT INTO LocationCities (LocationStateRegionId, Name)
SELECT s.LocationStateRegionId, v.City
FROM LocationStateRegions s
INNER JOIN LocationCountries c ON c.LocationCountryId = s.LocationCountryId
CROSS JOIN (VALUES
  (N'GB-ENG', N'London'),
  (N'GB-NIR', N'Belfast'),
  (N'GB-SCT', N'Edinburgh'),
  (N'GB-WLS', N'Cardiff')
) v(Code, City)
WHERE s.Code = v.Code AND c.IsoAlpha2 = N'GB'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationCities x WHERE x.LocationStateRegionId = s.LocationStateRegionId AND x.Name = v.City);
