SET NOCOUNT ON;
-- State/region and city seeds are limited to US, CA, AU, GB (capitals for cities). Other countries have country rows only.

INSERT INTO LocationStateRegions (LocationCountryId, Code, Name)
SELECT c.LocationCountryId, v.Code, v.Name
FROM LocationCountries c
CROSS JOIN (VALUES
  (N'US-AL', N'Alabama'),
  (N'US-AK', N'Alaska'),
  (N'US-AZ', N'Arizona'),
  (N'US-AR', N'Arkansas'),
  (N'US-CA', N'California'),
  (N'US-CO', N'Colorado'),
  (N'US-CT', N'Connecticut'),
  (N'US-DE', N'Delaware'),
  (N'US-DC', N'District of Columbia'),
  (N'US-FL', N'Florida'),
  (N'US-GA', N'Georgia'),
  (N'US-HI', N'Hawaii'),
  (N'US-ID', N'Idaho'),
  (N'US-IL', N'Illinois'),
  (N'US-IN', N'Indiana'),
  (N'US-IA', N'Iowa'),
  (N'US-KS', N'Kansas'),
  (N'US-KY', N'Kentucky'),
  (N'US-LA', N'Louisiana'),
  (N'US-ME', N'Maine'),
  (N'US-MD', N'Maryland'),
  (N'US-MA', N'Massachusetts'),
  (N'US-MI', N'Michigan'),
  (N'US-MN', N'Minnesota'),
  (N'US-MS', N'Mississippi'),
  (N'US-MO', N'Missouri'),
  (N'US-MT', N'Montana'),
  (N'US-NE', N'Nebraska'),
  (N'US-NV', N'Nevada'),
  (N'US-NH', N'New Hampshire'),
  (N'US-NJ', N'New Jersey'),
  (N'US-NM', N'New Mexico'),
  (N'US-NY', N'New York'),
  (N'US-NC', N'North Carolina'),
  (N'US-ND', N'North Dakota'),
  (N'US-OH', N'Ohio'),
  (N'US-OK', N'Oklahoma'),
  (N'US-OR', N'Oregon'),
  (N'US-PA', N'Pennsylvania'),
  (N'US-RI', N'Rhode Island'),
  (N'US-SC', N'South Carolina'),
  (N'US-SD', N'South Dakota'),
  (N'US-TN', N'Tennessee'),
  (N'US-TX', N'Texas'),
  (N'US-UT', N'Utah'),
  (N'US-VT', N'Vermont'),
  (N'US-VA', N'Virginia'),
  (N'US-WA', N'Washington'),
  (N'US-WV', N'West Virginia'),
  (N'US-WI', N'Wisconsin'),
  (N'US-WY', N'Wyoming')
) v(Code, Name)
WHERE c.IsoAlpha2 = N'US'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationStateRegions x WHERE x.LocationCountryId = c.LocationCountryId AND x.Code = v.Code);

INSERT INTO LocationStateRegions (LocationCountryId, Code, Name)
SELECT c.LocationCountryId, v.Code, v.Name
FROM LocationCountries c
CROSS JOIN (VALUES
  (N'CA-AB', N'Alberta'),
  (N'CA-BC', N'British Columbia'),
  (N'CA-MB', N'Manitoba'),
  (N'CA-NB', N'New Brunswick'),
  (N'CA-NL', N'Newfoundland and Labrador'),
  (N'CA-NS', N'Nova Scotia'),
  (N'CA-NT', N'Northwest Territories'),
  (N'CA-NU', N'Nunavut'),
  (N'CA-ON', N'Ontario'),
  (N'CA-PE', N'Prince Edward Island'),
  (N'CA-QC', N'Quebec'),
  (N'CA-SK', N'Saskatchewan'),
  (N'CA-YT', N'Yukon')
) v(Code, Name)
WHERE c.IsoAlpha2 = N'CA'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationStateRegions x WHERE x.LocationCountryId = c.LocationCountryId AND x.Code = v.Code);

INSERT INTO LocationStateRegions (LocationCountryId, Code, Name)
SELECT c.LocationCountryId, v.Code, v.Name
FROM LocationCountries c
CROSS JOIN (VALUES
  (N'AU-NSW', N'New South Wales'),
  (N'AU-VIC', N'Victoria'),
  (N'AU-QLD', N'Queensland'),
  (N'AU-WA', N'Western Australia'),
  (N'AU-SA', N'South Australia'),
  (N'AU-TAS', N'Tasmania'),
  (N'AU-ACT', N'Australian Capital Territory'),
  (N'AU-NT', N'Northern Territory')
) v(Code, Name)
WHERE c.IsoAlpha2 = N'AU'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationStateRegions x WHERE x.LocationCountryId = c.LocationCountryId AND x.Code = v.Code);

INSERT INTO LocationStateRegions (LocationCountryId, Code, Name)
SELECT c.LocationCountryId, v.Code, v.Name
FROM LocationCountries c
CROSS JOIN (VALUES
  (N'GB-ENG', N'England'),
  (N'GB-SCT', N'Scotland'),
  (N'GB-WLS', N'Wales'),
  (N'GB-NIR', N'Northern Ireland')
) v(Code, Name)
WHERE c.IsoAlpha2 = N'GB'
  AND NOT EXISTS (SELECT 1 FROM dbo.LocationStateRegions x WHERE x.LocationCountryId = c.LocationCountryId AND x.Code = v.Code);
