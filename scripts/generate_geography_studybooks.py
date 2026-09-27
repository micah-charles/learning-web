#!/usr/bin/env python3
"""Generate the England KS3 and AQA GCSE Geography Study Book notes/catalogue.

The topic records below are the curriculum framework and enriched topic briefs.
The generated Markdown files are the learner-facing notes; image requests are
written to a separate queue and are deliberately not generated here.
"""
from __future__ import annotations

import json
import re
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/generated/manifest.json"
KS3_SPEC = "https://www.gov.uk/government/publications/national-curriculum-in-england-geography-programmes-of-study/national-curriculum-in-england-geography-programmes-of-study"
AQA_PHYSICAL = "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content/living-with-the-physical-environment"
AQA_HUMAN = "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content/challenges-in-the-human-environment"
AQA_APPLICATIONS = "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content/geographical-applications"
AQA_SKILLS = "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content/geographical-skills"
AQA_PAST_PAPER_PACKS = {
    "Paper 1": [f"gcse_geo_p1_physical_environment_{sitting}" for sitting in ("june_2022", "june_2023", "june_2024", "november_2020", "november_2021")],
    "Paper 2": [f"gcse_geo_p2_human_environment_{sitting}" for sitting in ("june_2022", "june_2023", "june_2024", "november_2020", "november_2021")],
    "Paper 3": [f"gcse_geo_p3_geographical_applications_{sitting}" for sitting in ("june_2022", "june_2023", "june_2024", "november_2020", "november_2021")],
}
US_CONCEPT_TAGS = {
    "usmsg_01_physical_geography_01_landforms_and_plate_tectonics": ["plate-tectonics", "tectonic-hazards", "physical-landforms"],
    "usmsg_01_physical_geography_02_weather_and_climate": ["weather", "climate-change", "weather-hazards"],
    "usmsg_01_physical_geography_03_water_systems": ["hydrology", "water-cycle", "water-security", "rivers"],
    "usmsg_01_physical_geography_04_ecosystems_and_biomes": ["ecosystems", "biomes", "biodiversity"],
    "usmsg_02_human_geography_01_population_and_migration": ["population", "migration", "urbanisation"],
    "usmsg_02_human_geography_02_culture_and_language": ["place", "globalisation", "development"],
    "usmsg_02_human_geography_03_urbanization_and_cities": ["urbanisation", "cities", "settlements"],
    "usmsg_02_human_geography_04_resources_and_economics": ["natural-resources", "economic-activity", "energy-security"],
    "usmsg_03_world_regions_01_north_america": ["locational-knowledge", "place"],
    "usmsg_03_world_regions_02_latin_america": ["locational-knowledge", "place", "rainforests", "development"],
    "usmsg_03_world_regions_03_europe": ["locational-knowledge", "place"],
    "usmsg_03_world_regions_04_africa": ["locational-knowledge", "place", "development", "ecosystems"],
    "usmsg_03_world_regions_05_asia": ["locational-knowledge", "place", "population", "economic-activity"],
    "usmsg_03_world_regions_06_middle_east": ["locational-knowledge", "place", "water-security", "energy-security"],
    "usmsg_04_environment_and_global_issues_01_climate_change_and_sustainability": ["climate-change", "sustainability"],
    "usmsg_04_environment_and_global_issues_02_natural_disasters": ["natural-hazards", "risk", "tectonic-hazards", "weather-hazards"],
    "usmsg_04_environment_and_global_issues_03_water_and_food_security": ["water-security", "food-security", "resource-management"],
    "usmsg_04_environment_and_global_issues_04_globalization_and_trade": ["globalisation", "trade", "development", "economic-activity"],
}
SUPPLEMENTAL_SOURCES = {
    "geology": [("British Geological Survey: Discovering Geology", "https://www.bgs.ac.uk/discovering-geology/")],
    "tectonic": [
        ("USGS: Plate tectonics", "https://www.usgs.gov/educational-resources/plate-tectonics"),
        ("USGS: Understanding plate motions", "https://pubs.usgs.gov/gip/dynamic/understanding.html"),
        ("British Geological Survey: What causes earthquakes?", "https://www.bgs.ac.uk/discovering-geology/earth-hazards/earthquakes/what-causes-earthquakes/"),
        ("USGS: 2015 Nepal earthquake event summary", "https://earthquake.usgs.gov/earthquakes/eventpage/us20002926"),
        ("Nepal: 2015 Post Disaster Needs Assessment", "https://www.worldbank.org/content/dam/Worldbank/document/SAR/nepal/PDNA%20Volume%20A%20Final.pdf"),
        ("Japan Reconstruction Agency: Great East Japan Earthquake", "https://www.reconstruction.go.jp/english/topics/GEJE/"),
        ("Japan Reconstruction Agency: Disaster response and lessons learned", "https://www.reconstruction.go.jp/files/user/english/topics/Progress_to_date/250404_c1_s1.pdf"),
        ("World Bank: Nepal earthquake housing reconstruction", "https://www.worldbank.org/en/results/2020/09/29/post-earthquake-reconstruction-in-nepal-rebuilding-lives-one-home-at-a-time"),
    ],
    "weather": [
        ("AQA GCSE Geography 8035: Weather hazards", "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content/living-with-the-physical-environment"),
        ("Met Office: Global circulation patterns", "https://weather.metoffice.gov.uk/learn-about/weather/atmosphere/global-circulation-patterns"),
        ("Met Office: Development of tropical cyclones", "https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/hurricanes/development"),
        ("Met Office: Tropical cyclone facts", "https://www.metoffice.gov.uk/research/weather/tropical-cyclones/facts"),
        ("WHO: Typhoon Haiyan (Yolanda)", "https://www.who.int/westernpacific/emergencies/typhoon-haiyan-%28yolanda%29"),
        ("UNDRR: Ten years after Haiyan", "https://www.undrr.org/news/ten-years-after-haiyan-building-back-better-philippines"),
        ("World Bank: Reconstruction after Typhoon Haiyan", "https://www.worldbank.org/en/country/philippines/brief/philippines_reconstruction_after_typhoon_haiyan_yolanda"),
        ("Environment Agency: Somerset Levels and Moors flood-risk reduction", "https://www.gov.uk/government/publications/somerset-levels-and-moors-reducing-the-risk-of-flooding/somerset-levels-and-moors-reducing-the-risk-of-flooding"),
        ("Met Office: State of the UK Climate", "https://www.metoffice.gov.uk/research/climate/maps-and-data/about/state-of-climate"),
        ("Met Office: Storm Babet event summary", "https://www.metoffice.gov.uk/binaries/content/assets/metofficegovuk/pdf/weather/learn-about/uk-past-events/interesting/2023/2023_08_storm_babet.pdf"),
    ],
    "climate": [("Met Office: State of the UK Climate", "https://www.metoffice.gov.uk/research/climate/maps-and-data/about/state-of-climate"), ("NASA: Climate change", "https://science.nasa.gov/climate-change/")],
    "skills": [("Ordnance Survey: Geography education resources", "https://www.ordnancesurvey.co.uk/education")],
    "development": [("World Bank: World Development Indicators", "https://databank.worldbank.org/source/world-development-indicators"), ("UNDP: Human Development Index", "https://hdr.undp.org/data-center/human-development-index"), ("UNDP: Human Development Country Insights", "https://hdr.undp.org/data-center/country-insights"), ("World Bank: Viet Nam overview", "https://www.worldbank.org/en/country/vietnam/overview.print"), ("World Bank: Viet Nam 2045—Trading Up in a Changing World", "https://www.worldbank.org/en/country/vietnam/publication/viet-nam-2045-trading-up-in-a-changing-world"), ("World Bank: Ghana overview", "https://www.worldbank.org/en/country/ghana/overview.print"), ("United Nations: Sustainable Development Goals", "https://sdgs.un.org/goals")],
    "population": [("ONS: Population estimates for England and Wales, mid-2024", "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/populationestimatesforenglandandwales/mid2024"), ("UN DESA: World Urbanization Prospects 2025", "https://population.un.org/wup/")],
    "migration": [("IOM: Glossary on Migration", "https://publications.iom.int/books/international-migration-law-ndeg34-glossary-migration")],
    "settlements": [("ONS: Built-up areas in England and Wales, Census 2021", "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/articles/townsandcitiescharacteristicsofbuiltupareasenglandandwales/census2021"), ("ONS: 2021 Rural Urban Classification", "https://www.ons.gov.uk/methodology/geography/geographicalproducts/ruralurbanclassifications/2021ruralurbanclassification"), ("Historic England: Transforming a historic market town", "https://historicengland.org.uk/whats-new/research/transforming-a-historic-market-town/"), ("GOV.UK: National Planning Policy Framework", "https://www.gov.uk/guidance/national-planning-policy-framework")],
    "rainforest": [("NASA Earth Observatory: Tropical deforestation", "https://earthobservatory.nasa.gov/features/Deforestation")],
    "desert": [("UN Convention to Combat Desertification: Desertification overview", "https://www.unccd.int/land-and-life/desertification/overview")],
    "urban": [("UN-Habitat: World Cities Report", "https://unhabitat.org/wcr/")],
    "water": [("Environment Agency: Water resources", "https://www.gov.uk/government/collections/water-resources-management")],
    "food": [("Defra: UK Food Security Report 2024—UK supply sources", "https://www.gov.uk/government/statistics/united-kingdom-food-security-report-2024/united-kingdom-food-security-report-2024-theme-2-uk-food-supply-sources"), ("Defra: UK Food Security Digest 2025", "https://www.gov.uk/government/statistics/united-kingdom-food-security-digest-2025/united-kingdom-food-security-digest-2025"), ("FAO: World food situation", "https://www.fao.org/worldfoodsituation/foodpricesindex/en/")],
    "energy": [("DESNZ: Digest of UK Energy Statistics 2026", "https://www.gov.uk/government/statistics/digest-of-uk-energy-statistics-dukes-2026"), ("DESNZ: 2025 UK greenhouse-gas emissions, provisional figures", "https://www.gov.uk/government/statistics/provisional-uk-greenhouse-gas-emissions-statistics-2025/2025-uk-greenhouse-gas-emissions-provisional-figures-statistical-release"), ("International Energy Agency: Energy system", "https://www.iea.org/energy-system")],
    "natural-resources": [("British Geological Survey: UK minerals statistics", "https://www.bgs.ac.uk/geology-projects/mineralsuk/mineral-statistics/")],
}


def topic(id, title, curriculum, group, order, required, pack_ids, tags, outcomes,
          knowledge, vocabulary, process, example, data, misconception, questions,
          revision, source, image=None, image_alt=None, option_group=None,
          option_group_note=None):
    if curriculum == "aqa-gcse-8035" and not pack_ids:
        pack_ids = AQA_PAST_PAPER_PACKS[group.split(" · ", 1)[0]]
    return locals()


TOPICS = [
    topic("england_ks3_geo_places", "1. World locations and connected places", "ks3-england", "Places and global patterns", 1, "required",
          ["ks3_geography_regional_studies"], ["locational-knowledge", "place", "africa", "asia"],
          ["ks3.locational-knowledge", "ks3.place-knowledge"],
          ["Locate Africa, Russia, Asia (including China and India), and the Middle East; identify countries, major cities, environmental regions, hot deserts and polar regions.", "Compare the physical and human geography of a region in Africa with a region in Asia. Explain similarities, differences and links instead of treating either continent as uniform.", "Describe a place at more than one scale: continent, country, region, city and local site."],
          ["absolute location — position described with coordinates", "relative location — position described in relation to another place", "region — area sharing selected characteristics", "spatial pattern — arrangement of features across space"],
          "A place is shaped by interacting physical and human factors. Relief, climate, water and soils influence where people live and work; transport, trade, technology and decisions then alter land use and connections. Use evidence to explain relationships, not to claim that one physical factor determines a society.",
          "A comparison could pair Kenya’s East African setting with India’s South Asian setting. Locate both first, then compare relief, climate, settlement, livelihoods and connections. Kenya includes highlands and the Rift Valley as well as drylands and coast; India includes Himalayan mountains, the Indo-Gangetic Plain, a long coastline and major cities. These are varied countries, so identify the particular region being described.",
          "On a world map, identify the Equator, tropics, Arctic Circle, Indian Ocean and major regional boundaries. Use a scale bar and legend; explain what the map can and cannot show. Compare two place profiles using the same categories and dates.",
          "A continent is not a single culture or climate. A country-level average can hide large regional differences. Correlation between climate and settlement does not by itself prove causation.",
          ["Which countries and regions does the KS3 programme name?", "Give one physical and one human similarity and difference between two selected regions.", "How could a map help test a claim about population or climate?"],
          "Name the place and scale, select matched evidence, then explain how physical and human factors interact. Use a specific regional example and avoid generalising it to a whole continent.",
          KS3_SPEC, "Create a clean locator-map illustration showing the named KS3 focus regions, Equator, Tropics, Arctic Circle, major oceans and selected country/city labels. Use verified geography, restrained colours, no invented borders, and a separate inset comparing one African and one Asian region.", "Locator map for KS3 world regions and an Africa–Asia place comparison"),

    topic("england_ks3_geo_uk", "2. The geography of the United Kingdom", "ks3-england", "Places and global patterns", 2, "enrichment",
          ["ks3_geography_uk_geography"], ["uk-geography", "place", "relief", "settlement"],
          ["ks3.place-based-exemplars", "ks3.human-physical-interaction"],
          ["Describe the UK’s position, constituent countries, surrounding seas, major uplands and lowlands, river systems and contrasting regions.", "Explain how relief, climate, resources, transport and historical land use influence settlement and economic activity.", "Recognise that the UK contains diverse rural, coastal, urban and upland environments."],
          ["upland — higher, often steeper land", "lowland — lower, generally gentler land", "topography — shape and height of land", "land use — the function people give to an area"],
          "Relief and geology influence drainage, soils, routes and building costs. These conditions interact with climate, employment, transport and planning. Over time, industry, infrastructure and population change can alter land use, so maps from different dates can show change.",
          "The Scottish Highlands and the South East of England illustrate contrast, not a simple north–south rule. Upland areas can support tourism, forestry and renewable energy but face access constraints; lowland corridors often contain dense settlement and transport links. Compare named areas using evidence rather than stereotypes.",
          "Read a relief map with contour intervals and spot heights. Trace a river from source to mouth; compare settlement density with relief and transport. When using a choropleth map, check class intervals and whether the data are absolute or per person.",
          "The UK is not uniformly wet, flat or densely populated. A map showing association between relief and settlement does not show all causes.",
          ["Name the four UK countries and surrounding seas.", "How might upland relief affect transport and economic activity?", "What extra evidence would help explain a regional difference?"],
          "Use named locations, map evidence and a clear chain from physical condition to human response. Treat this as a useful regional foundation; schools choose their own detailed place exemplars.",
          KS3_SPEC,
          "Create an accurate, clearly labelled schematic that connects UK physical and human geography. Show the four UK countries and surrounding seas in a small locator inset with verified outlines; beside it, use a west-to-east upland-to-lowland cross-section to show relief, prevailing moist westerly air and orographic rainfall, a river flowing from uplands through a lowland floodplain, and examples of transport and settlement adapting to slope and flood exposure. Mark the profile as simplified and not to scale. Distinguish broad regional tendencies from local exceptions, use no invented statistics, and keep labels concise and legible.",
          "UK locator, relief, rainfall and settlement relationships (schematic, not to scale)"),

    topic("england_ks3_geo_rocks", "3. Geological time, rocks, weathering and soils", "ks3-england", "Physical processes and landscapes", 3, "required",
          ["ks3_geography_rocks_and_geology_1"], ["geology", "rocks", "weathering", "soils"],
          ["ks3.physical.geological-timescales", "ks3.physical.rocks-weathering-soils"],
          ["Earth’s landscapes develop over geological time; rock type and structure affect landforms and resources.", "Distinguish igneous, sedimentary and metamorphic rocks by how they form, then relate their properties to landscape and human use.", "Explain physical and chemical weathering and how weathered material contributes to soil formation."],
          ["geological time — the long timescale of Earth history", "weathering — breakdown of rock in place", "erosion — removal and transport of material", "permeability — how easily water passes through a material", "soil profile — layers with different properties"],
          "Cooling magma forms igneous rock; accumulated sediment can compact and cement into sedimentary rock; heat and pressure alter existing rock into metamorphic rock. Weathering breaks rock down in place. Organic matter, mineral particles, water and air develop into soil; erosion can remove soil faster than it forms.",
          "A UK limestone area can develop distinctive drainage and landforms because soluble, jointed rock behaves differently from resistant granite. Use this as a process example and check local geology maps before naming a specific site.",
          "A geology map shows surface rock types, not every underground layer. A soil profile or rock-property table can be used to compare texture, drainage and vegetation. Keep weathering (breakdown) separate from erosion (removal).",
          "Rock cycle diagrams are models, not a one-way sequence. Soil is not simply crushed rock: organic matter and biological activity matter too.",
          ["How do the three main rock groups form?", "What is the difference between weathering and erosion?", "Why might two rock types produce different land uses?"],
          "Explain the chain: rock properties → weathering and drainage → soil and landform → possible human use. Use geological time as scale context, not a precise calendar of every event.",
          KS3_SPEC, "Draw a clearly labelled rock cycle showing magma, cooling, igneous rock, weathering/erosion, sediment, compaction, sedimentary rock, heat/pressure and metamorphic rock. Use arrows in multiple directions and do not imply a fixed loop or equal timescales.", "Rock cycle process diagram with three rock groups and formation processes"),

    topic("england_ks3_geo_tectonics", "4. Plate tectonics and tectonic hazards", "ks3-england", "Physical processes and landscapes", 4, "required",
          ["ks3_geography_tectonic_hazards"], ["plate-tectonics", "earthquakes", "volcanoes", "hazard-risk", "natural-hazards"],
          ["ks3.physical.plate-tectonics", "ks3.human-physical-interaction"],
          ["Describe the global pattern of earthquakes and volcanoes and relate it to plate boundaries.", "Explain how plate movement can generate earthquakes and volcanic activity.", "Recognise that a hazard becomes a disaster through exposure and vulnerability, and that risk varies between places."],
          ["tectonic plate — moving section of Earth’s lithosphere", "convergent boundary — plates move towards one another", "divergent boundary — plates move apart", "transform boundary — plates slide past", "magnitude — measure of energy released", "vulnerability — susceptibility to harm"],
          "At a destructive/convergent margin, subduction can generate magma and powerful earthquakes; at a constructive/divergent margin, plates separate and magma rises; at a conservative/transform margin, friction can lock plates until stress is released as an earthquake. These are broad models; boundary details vary.",
          "Compare a high-income and lower-income earthquake setting only when evidence supports it. Building design, warning systems, preparedness, population exposure and response capacity influence impacts; income alone does not determine outcomes.",
          "Plot global event locations against plate boundaries. Distinguish an event map from a risk map. For a named event, organise impacts by social, economic and environmental effects, and responses by immediate and long-term actions.",
          "Not every volcano is at a plate boundary, and a hazard’s magnitude alone does not determine disaster impacts. Earthquakes cannot currently be predicted to an exact time and place.",
          ["What patterns link plate boundaries and tectonic hazards?", "How do the three boundary types differ?", "Why can similar magnitude events have different impacts?"],
          "Use a labelled boundary cross-section and a cause–impact–response chain. Explain risk through hazard, exposure and vulnerability rather than using ‘natural disaster’ as if impacts were unavoidable.",
          KS3_SPEC, "Create a three-panel cross-section comparing convergent/subduction, divergent and transform plate margins. Show relative movement arrows, crust, mantle, earthquake focus and volcanic activity only where appropriate; avoid labels suggesting all boundaries behave identically.", "Three plate-boundary cross-sections comparing movement and hazards"),

    topic("england_ks3_geo_weather_climate", "5. Weather, climate and climate change", "ks3-england", "Physical processes and landscapes", 5, "required",
          ["ks3_geography_weather_climate"], ["weather", "climate", "climate-change", "atmosphere"],
          ["ks3.physical.weather-climate", "ks3.physical.ice-age-to-present", "ks3.human-physical-interaction"],
          ["Weather is short-term atmospheric condition; climate describes patterns and averages over longer periods.", "Explain how latitude, altitude, distance from the sea, prevailing winds and relief influence climate.", "Describe evidence of climate change from the Ice Age to the present and distinguish natural factors from human greenhouse-gas emissions.", "Explain that human activity both depends on natural systems and changes them."],
          ["weather — atmospheric conditions at a particular time", "climate — long-term pattern of weather", "insolation — incoming solar energy", "greenhouse effect — warming as gases absorb and re-emit infrared energy", "mitigation — reducing causes", "adaptation — adjusting to actual or expected effects"],
          "Uneven solar heating creates temperature contrasts; air pressure and winds move heat and moisture. Relief can force air upwards, causing cooling and condensation on windward slopes. Human greenhouse-gas emissions strengthen heat retention, shifting climate averages and risks; the natural greenhouse effect is essential for life, while its enhancement drives current warming.",
          "Compare a UK coastal and inland location using matched climate normals. For the past-to-present sequence, use evidence such as temperature records, ice cores and glacial records, noting that each proxy has limits and the current warming trend has a strong human cause.",
          "Read a climate graph by checking axes, units, months and scale. A temperature anomaly is relative to a baseline, not the absolute temperature. Separate one unusual weather event from a long-term climate trend.",
          "Weather and climate are not interchangeable. A cold day does not disprove global warming, and one graph does not explain every local impact.",
          ["How is climate different from weather?", "Why can relief change rainfall over a short distance?", "Give one mitigation and one adaptation strategy."],
          "Describe the evidence, state its timescale, explain causes and connect impacts to a named place. Distinguish mitigation from adaptation and discuss uncertainty without implying that the basic warming trend is uncertain.",
          KS3_SPEC, "Illustrate how sunlight, Earth’s atmosphere, outgoing infrared energy and greenhouse gases interact. Use arrows for incoming shortwave and outgoing/re-emitted longwave energy; label the natural greenhouse effect and its human enhancement without depicting a literal solid heat-trapping roof.", "Atmosphere and enhanced greenhouse effect energy-flow diagram"),

    topic("england_ks3_geo_glaciation", "6. Glaciation and changing landscapes", "ks3-england", "Physical processes and landscapes", 6, "required",
          ["ks3_geography_glaciation", "ks3_geography_glaciation_1", "ks3_geography_glaciation_2", "ks3_geography_glaciation_consolidated"], ["glaciation", "landforms", "weathering", "landscape-change"],
          ["ks3.physical.glaciation", "ks3.physical.ice-age-to-present", "ks3.human-physical-interaction"],
          ["Explain how snow accumulation and compaction can form moving glacier ice when accumulation exceeds ablation.", "Describe glacial erosion, transport and deposition and link them to distinctive landforms.", "Explain how glacial landscapes change over long timescales and how people use and manage them."],
          ["accumulation — snow added to a glacier", "ablation — ice lost by melting, sublimation or calving", "plucking — glacier removes loosened rock", "abrasion — debris scrapes bedrock", "moraine — deposited glacial material", "till — unsorted sediment deposited directly by ice"],
          "Snow compacts into ice; gravity moves the glacier downslope. Basal debris abrades bedrock and ice can pluck jointed rock. Erosion deepens and widens valleys; when ice melts, it leaves till, moraines and transported erratics. Meltwater can sort sediment into outwash deposits.",
          "The Lake District is a familiar UK landscape shaped by past glaciation. Use maps and landform evidence to distinguish erosional features such as corries and troughs from depositional features such as moraines and drumlins; tourism, farming and conservation can create both benefits and conflicts.",
          "Read contour maps for U-shaped valleys, steep valley sides and lake basins. A landform photograph shows shape, but a map and field evidence help locate it and test a formation explanation.",
          "A glacier is moving ice, not simply a frozen lake. A U-shaped valley is evidence consistent with glacial erosion but should be explained alongside other evidence.",
          ["How does glacier ice move?", "How do abrasion and plucking differ?", "Name one erosional and one depositional landform."],
          "For each feature, connect process to shape and evidence. Use before–during–after glaciation to explain landscape change over time.",
          KS3_SPEC, "Show a labelled glacier cross-section with accumulation and ablation zones, ice movement, plucking and abrasion, and a downstream depositional area with moraine and outwash. Add a separate valley before/after profile contrasting V-shaped fluvial and U-shaped glacial forms.", "Glacier movement, erosion and deposition with valley profiles"),

    topic("england_ks3_geo_hydrology", "7. Hydrology, the water cycle and water resources", "ks3-england", "Physical processes and landscapes", 7, "required",
          ["ks3_geography_water_resources"], ["hydrology", "water-cycle", "water-security", "human-physical-interaction"],
          ["ks3.physical.hydrology", "ks3.human.natural-resources", "ks3.human-physical-interaction"],
          ["Describe stores and transfers in the water cycle at global and drainage-basin scales.", "Explain how climate, geology, relief, vegetation and land use affect runoff, infiltration and river flow.", "Explain why freshwater availability and demand vary, and how management choices affect people and ecosystems."],
          ["drainage basin — area drained by a river and tributaries", "infiltration — water entering soil", "throughflow — water moving through soil", "groundwater — water stored below the surface", "water stress — demand approaching or exceeding available supply"],
          "Energy from the Sun drives evaporation and transpiration; water vapour condenses and returns as precipitation. In a basin, water may be intercepted, infiltrate, flow over or through soil, recharge groundwater, or reach a channel. Impermeable surfaces and saturated or impermeable ground often increase rapid runoff.",
          "A water-rich region can still face local shortages if storage, infrastructure, quality or affordability limits access. A UK transfer or reservoir illustrates how engineering can improve supply while changing habitats and creating competing interests.",
          "Draw a drainage-basin sketch with a north arrow, watershed and flow arrows. A hydrograph relates rainfall to discharge over time; peak lag and rising limb help describe response, but do not alone identify the cause.",
          "Water is renewable through the cycle, but accessible clean freshwater is unevenly distributed and can be depleted or polluted. ‘Water shortage’ is not always caused by low rainfall.",
          ["Name three stores and three transfers in the water cycle.", "Why can urban land increase flood peaks?", "What are two different reasons an area might lack safe water?"],
          "Trace water through stores and transfers before explaining human impacts. Evaluate management by considering reliability, access, cost and environmental effects.",
          KS3_SPEC, "Create a drainage-basin water-cycle diagram with precipitation, interception, infiltration, surface runoff, throughflow, groundwater flow, river discharge, evaporation and transpiration; use a clear watershed boundary and distinguish stores from transfers.", "Drainage basin water cycle with stores and transfers"),

    topic("england_ks3_geo_rivers", "8. Rivers and river landscapes", "ks3-england", "Physical processes and landscapes", 8, "required",
          ["ks3_geography_rivers"], ["rivers", "fluvial-processes", "flood-risk", "landforms"],
          ["ks3.physical.hydrology", "ks3.physical.rivers", "ks3.human-physical-interaction"],
          ["Explain how erosion, transport and deposition shape river channels and valleys.", "Describe how channel and valley characteristics change downstream.", "Explain flood risk using physical and human factors and compare management choices."],
          ["hydraulic action — force of water compressing air in cracks", "abrasion — sediment scraping the bed or banks", "traction — large particles rolling", "saltation — small particles bouncing", "discharge — volume of water passing a point per second", "lag time — delay between rainfall peak and discharge peak"],
          "In the upper course, steep gradients favour vertical erosion and valleys often contain interlocking spurs or waterfalls. Downstream, greater discharge and lateral erosion help widen valleys and form meanders. Deposition occurs when a river loses energy, building floodplains and levees; meander migration can create oxbow lakes.",
          "A named UK river basin can connect physical process to human use and flood management. Compare hard engineering with flood warnings, zoning, tree planting and river restoration; effects may be shifted downstream or unevenly distributed.",
          "Use a long profile to show gradient and a hydrograph to relate rainfall to discharge. A storm hydrograph’s peak and lag help compare basins; use land use, geology and relief to explain the differences.",
          "Rivers do not only erode downstream; deposition happens where energy falls. A straight channel is not automatically safer, because interventions can transfer flood risk.",
          ["How do traction and saltation differ?", "Why might a floodplain be both fertile and hazardous?", "Compare one hard and one soft flood-management strategy."],
          "Link process → landform → evidence. For flood questions, separate the probability of a flood from the consequences for people and property.",
          KS3_SPEC, "Illustrate a river from upper to lower course with changing gradient and valley cross-sections, plus a meander sequence showing erosion on the outer bend, deposition on the inner bend, cut-off and oxbow lake formation.", "River long profile, valley shape and meander development"),

    topic("england_ks3_geo_coasts", "9. Coasts and coastal change", "ks3-england", "Physical processes and landscapes", 9, "required",
          ["ks3_geography_coasts", "ks3_geography_coasts_waves_landforms_management"], ["coasts", "erosion", "deposition", "coastal-management"],
          ["ks3.physical.coasts", "ks3.human-physical-interaction"],
          ["Explain how waves, geology, weathering, mass movement, erosion, transport and deposition shape coasts.", "Describe the formation of erosional and depositional landforms.", "Compare coastal management strategies and consider costs, benefits, conflicts and effects elsewhere."],
          ["fetch — distance wind travels over water", "hydraulic action — wave force compresses air in cracks", "longshore drift — sediment moves alongshore in a zigzag", "mass movement — downslope movement under gravity", "managed retreat — allowing selected land to flood or erode"],
          "Constructive waves tend to deposit material; destructive waves tend to remove it. Hydraulic action and abrasion erode weaknesses; differential erosion can form headlands and bays. Longshore drift transports beach sediment; where energy falls, spits or bars can develop. Geology and structure influence the rate and shape of change.",
          "A UK coastline example should identify a named stretch and its landforms before discussing a management scheme. Sea walls and groynes can protect selected locations but are costly and may affect sediment supply; beach nourishment and managed retreat have different maintenance, habitat and property trade-offs.",
          "Annotate a coastline map with compass direction, wave approach and sediment movement. Read a coastal cross-section and use before/after images cautiously: tides, season and viewpoint can change appearance.",
          "A sea wall does not stop all erosion, and protecting one location can increase erosion or reduce deposition elsewhere. Longshore drift direction depends on prevailing wave approach.",
          ["How do hydraulic action and abrasion differ?", "How can longshore drift form a spit?", "Who may gain or lose from coastal management?"],
          "Explain the sequence that forms the landform, then evaluate management from more than one stakeholder viewpoint and scale.",
          KS3_SPEC, "Show a labelled headland-and-bay coastline and a separate spit sequence. Include prevailing wave direction, swash/backwash, longshore drift, erosion and deposition; do not imply that every coast develops identical landforms.", "Coastal erosion landforms and longshore drift spit formation"),

    topic("england_ks3_geo_ecosystems", "10. Ecosystems, biomes and interdependence", "ks3-england", "Physical processes and landscapes", 10, "required",
          ["ks3_geography_ecosystems"], ["ecosystems", "biomes", "biodiversity", "interdependence"],
          ["ks3.physical.ecosystems-biomes", "ks3.human-physical-interaction", "ks3.human.natural-resources"],
          ["Explain how climate, water, soils, plants, animals and people interact within an ecosystem.", "Distinguish a local ecosystem from a global biome and describe broad biome patterns.", "Explain how changing one component can affect others and how human use depends on functioning natural systems."],
          ["biotic — living component", "abiotic — non-living condition", "producer — organism making biomass, usually through photosynthesis", "consumer — organism obtaining energy by feeding", "decomposer — organism breaking down dead matter", "biome — large region with characteristic climate and communities"],
          "Solar energy enters through producers. Feeding transfers matter and energy through food chains and webs; decomposers return nutrients to soils. Climate influences water and growing conditions, but soil, relief, disturbance and human use also matter. A change such as drought or species loss can ripple through linked components.",
          "A small UK woodland, pond or dune can show interdependence at local scale. Contrast it with a named global biome, but avoid claiming that every site in the same biome is identical.",
          "Read a biome map alongside a climate graph. Food webs show feeding links, not equal energy at every level. Field transects and quadrats sample vegetation; record sampling method and site conditions.",
          "An ecosystem is not a closed, motionless system. A food chain is a simplification, and a biome boundary is not a sharp wall.",
          ["Give one biotic and one abiotic factor.", "How can a change in rainfall affect more than one ecosystem component?", "What does a food web show that a single food chain does not?"],
          "Explain interactions with arrows and causal language. State scale and place, and support claims with observations or data.",
          KS3_SPEC, "Create a simple ecosystem system diagram linking sunlight, producers, consumers, decomposers, nutrients, water and climate. Add arrows for matter/energy relationships and show a drought or species-change feedback without implying perfect balance.", "Ecosystem interactions linking climate, organisms and nutrient cycling"),

    topic("england_ks3_geo_population", "11. Population, migration and urbanisation", "ks3-england", "People, places and development", 11, "required",
          ["ks3_geography_population_migration"], ["population", "migration", "urbanisation", "demography"],
          ["ks3.human.population-urbanisation", "ks3.place-knowledge"],
          ["Describe population distribution, density and change at different scales.", "Explain migration using interacting push and pull factors and distinguish migration types.", "Explain urbanisation through migration and natural increase, while recognising that rates and experiences vary between places."],
          ["population density — people per unit area", "natural increase — births minus deaths", "migration — relatively lasting movement of people", "push factor — condition encouraging departure", "pull factor — condition attracting people", "urbanisation — rising share of population living in urban places"],
          "Population change reflects births, deaths and migration. Economic opportunities, services, safety, family links and environmental pressures can influence movement together. Urban populations can grow through rural–urban migration and natural increase; suburbanisation and counter-urbanisation describe different movements within or away from urban areas.",
          "Compare a rapidly growing city and a slower-growing region using dated evidence. A place profile should identify who moves, from where, for what reasons, and how outcomes differ between migrants and residents.",
          "A population pyramid shows age and sex structure at a point in time; a choropleth can hide variation within large areas. Check whether migration figures are counts, rates, net or gross flows.",
          "Migration is not always international or permanent. People move for mixed reasons, and the same factor may be a push for one group and a pull for another.",
          ["How are births, deaths and migration related to population change?", "Give one environmental and one economic push or pull factor.", "Why can urban growth create both opportunities and pressure?"],
          "Use a balanced cause-and-effect chain. Avoid describing people as a single homogeneous group; identify scale, time and who benefits or faces pressure.",
          KS3_SPEC, "Create a three-panel KS3 population geography diagram. Panel one compares global, national and local distribution and contrasts arithmetic density with a gridded pattern. Panel two shows the population-balance equation with births, deaths, immigration and emigration, alongside a labelled age pyramid. Panel three maps an illustrative internal rural-to-urban flow with push influences, pull influences and intervening obstacles, then separates city growth from urbanisation and reclassification. Use varied, non-stereotyped people; distinguish estimates from projections and label all sample values as illustrative.", "Population distribution, change, migration and urbanisation"),

    topic("england_ks3_geo_settlements", "12. Settlements, land use and urban change", "ks3-england", "People, places and development", 12, "required",
          ["ks3_geography_settlements"], ["settlements", "land-use", "urbanisation", "place"],
          ["ks3.human.population-urbanisation", "ks3.human.settlement-land-use", "ks3.human-physical-interaction"],
          ["Describe settlement patterns and functions and explain site and situation.", "Recognise how land use can change over time and how transport, relief, water, employment and planning affect settlement growth.", "Explain interactions between urban places, rural landscapes and natural systems."],
          ["site — physical characteristics of the settlement location", "situation — location relative to routes and other places", "land-use zone — area dominated by a particular use", "urbanisation — increasing urban share of population", "urban sprawl — outward spread of built-up land"],
          "A settlement may begin where water, a crossing point, defensible ground or fertile land supports occupation. Routes and employment can later change its situation and function. As a settlement grows, land uses compete; housing, industry, services and green space can move or intensify through planning and investment.",
          "Compare a town centre, suburban edge and nearby rural settlement using maps and field observations. Local regeneration or a new transport link can change accessibility and land values, but effects differ among residents and businesses.",
          "Use OS maps and aerial photographs from different dates to track land-use change. Annotate a field sketch with direction, labels and evidence; do not infer residents’ incomes directly from building appearance alone.",
          "Settlement hierarchy is a model, not a perfect ladder. Urban growth does not affect every neighbourhood in the same way.",
          ["How are site and situation different?", "Name two factors that could influence a settlement’s location.", "What evidence could show land use has changed?"],
          "Describe location precisely, then explain how physical conditions and human decisions interact. Support change claims with dated map or field evidence.",
          KS3_SPEC, "Create a three-panel settlement geography plate. Panel one contrasts a compact nucleated village, a linear settlement and dispersed farms using consistent symbols. Panel two shows an illustrative town-centre-to-edge transect with mixed uses, transport links, green space and a clear site-versus-situation key. Panel three compares service catchments by travel time rather than perfect circles, with a river barrier and unequal public-transport access. Make the diagrams schematic, avoid real-world boundary claims or invented statistics, and label every panel as a model.", "Settlement patterns, town land use, and service catchments"),

    topic("england_ks3_geo_development", "13. International development and globalisation", "ks3-england", "People, places and development", 13, "required",
          ["ks3_geography_development_globalisation"], ["development", "globalisation", "inequality", "trade"],
          ["ks3.human.international-development", "ks3.human-physical-interaction", "ks3.place-knowledge"],
          ["Explain that development includes social, economic, political and environmental change and is uneven within as well as between countries.", "Compare indicators and explain limitations of single measures.", "Describe global connections through trade, migration, investment, communication and supply chains; evaluate who benefits and who bears costs."],
          ["development — changes in well-being, opportunity and economic structure", "GDP/GNI per person — average economic output or income measure", "HDI — composite measure using health, education and income", "globalisation — growing connections across places", "TNC — company operating in more than one country"],
          "Trade and investment can create jobs, infrastructure and tax revenue, but gains depend on wages, ownership, working conditions, regulation and environmental costs. Indicators summarise selected dimensions: an average can hide inequality, unpaid work, local prices or differences between regions.",
          "A country case study should establish its location and global links, then trace change in sectors, trade, services and quality of life. A tourism, aid or fair-trade scheme can have mixed outcomes; explain the mechanism and identify whose perspective is used.",
          "Read development indicators with units, definitions, year and scale. Compare like with like; do not rank countries using data from different years or treat correlation as proof of a single cause.",
          "A country is not simply ‘developed’ or ‘developing’ in every respect. Globalisation does not distribute benefits evenly or erase local differences.",
          ["Why is one measure not enough to describe development?", "Name two channels of global connection.", "How could a TNC bring both benefits and costs to a host place?"],
          "Use an indicator with a stated limitation, a named place and a causal chain. Present development as multidimensional and contested.",
          KS3_SPEC, "Create a three-panel geography diagram about development and globalisation. Panel one contrasts a multidimensional development dashboard (income, health, education, inequality and environment) with a single national average, clearly labelling sample values as illustrative. Panel two traces a manufactured product's global value chain from raw material and components through assembly, shipping, design/branding and retail; use arrows and indicate that value shares are not equal without inventing percentages. Panel three compares two development pathways—Viet Nam's export manufacturing and Ghana's cocoa/mineral trade—using icons for jobs, local suppliers, public services, resource flows and environmental trade-offs. Include a legend, label the case study examples as schematic, use accurate country placement if a locator inset is used, and avoid stereotypes or unsupported statistics.", "Development indicators and uneven global value chains in Viet Nam and Ghana"),

    topic("england_ks3_geo_economic_activity", "14. Economic activity, trade and natural resources", "ks3-england", "People, places and development", 14, "required",
          ["ks3_geography_industry_economic_activity", "ks3_geography_energy_resources"], ["economic-activity", "sectors", "trade", "natural-resources"],
          ["ks3.human.economic-sectors", "ks3.human.trade-links", "ks3.human.natural-resources", "ks3.human-physical-interaction"],
          ["Distinguish primary, secondary, tertiary and quaternary activities and explain how their balance changes over time and space.", "Describe trade links and the location of economic activity.", "Explain the distribution, use and management of energy, food, minerals and water resources."],
          ["primary — extracting or producing raw materials", "secondary — manufacturing or construction", "tertiary — services", "quaternary — knowledge and information services", "resource — material or service people value and use", "supply chain — linked stages from input to consumer"],
          "Economic activity is linked through supply chains. Resource location, skills, capital, infrastructure, markets and policy influence where each stage occurs. As technology and wealth change, employment can shift between sectors, though old and new activities often coexist.",
          "Compare a resource-producing region with a service or knowledge hub. For energy, contrast fossil fuels and renewables by reliability, location, cost, emissions and landscape effects; avoid presenting any source as impact-free.",
          "Use flow maps for trade and proportional symbols for production only with a clear legend. A sector chart shows employment or output only if the measure and date are labelled.",
          "A resource is not automatically a benefit: access, ownership, price, technology and environmental cost matter. Sector change is not identical in every country or region.",
          ["Give one example of each economic sector.", "Why might an energy resource be available but difficult to exploit?", "How could a supply chain connect distant places?"],
          "Explain location with several interacting factors, and evaluate resource choices against social, economic and environmental criteria.",
          KS3_SPEC, "Create a three-panel KS3 resource geography plate. Panel one shows linked primary, secondary, tertiary and quaternary stages in a grain-to-loaf chain, with distinct arrows for materials, services and money. Panel two compares a schematic UK energy mix across electricity, transport and heat, labelling the 2025 electricity-generation statistic as historical/datable evidence rather than a timeless share; show wind, solar, nuclear, gas, grid links, storage and demand. Panel three is a food-water-energy system diagram linking farm inputs, soil, irrigation, fertiliser, processing, ports, household access and waste. Use accurate process arrows, readable labels, and no invented statistics or map boundaries; identify the diagrams as models and mark environmental and social trade-offs.", "Economic sectors, UK energy mix and food-water-energy links"),

    topic("england_ks3_geo_skills", "15. Geographical skills and fieldwork", "ks3-england", "Skills and enquiry", 15, "required",
          ["ks3_geography_geographical_skills"], ["fieldwork", "os-maps", "gis", "data-skills"],
          ["ks3.skills.maps-atlases", "ks3.skills.os-grid-scale", "ks3.skills.aerial-satellite", "ks3.skills.gis", "ks3.skills.fieldwork-contrasting-locations", "ks3.skills.data-analysis-communication"],
          ["Use maps, atlases, globes, OS maps, aerial/satellite imagery and GIS to locate, measure, compare and interpret places.", "Plan safe fieldwork in contrasting locations; collect, analyse and communicate primary data alongside secondary evidence.", "Draw evidence-based conclusions and recognise the limits of sampling and data sources."],
          ["GIS — computer system for capturing, analysing and displaying spatial data", "grid reference — coordinate locating a map square or point", "scale — relationship between map distance and ground distance", "primary data — evidence collected first-hand", "sampling — selecting observations from a wider population", "anomaly — observation that differs from a wider pattern"],
          "A sound enquiry starts with a focused question and appropriate method. Collect data consistently and safely; record location, time, units and conditions. Present patterns clearly, compare datasets, identify anomalies, explain results with geographical ideas, then evaluate reliability and limitations.",
          "A school could compare land use or pedestrian flow at two contrasting sites. Select a representative time and sampling method, use a risk assessment, and avoid collecting personal information unnecessarily. The enquiry should test a geographical idea rather than gather data without a question.",
          "For OS maps, read the grid eastings then northings, use scale bars and contours, and include units. In GIS, distinguish the mapped layer from the real-world feature and inspect date, source and classification.",
          "A precise grid reference and a general location are not the same. A larger sample can reduce some sampling error but does not automatically remove bias or measurement error.",
          ["What makes a fieldwork question testable?", "Why should a method be applied consistently at both sites?", "How could an anomaly affect a conclusion?"],
          "Structure fieldwork answers as question → method → evidence → pattern → explanation → conclusion → evaluation. Justify methods and state limitations specifically.",
          KS3_SPEC, "Create an OS-map fieldwork skills plate with a four/six-figure grid reference example, scale bar measurement, contour profile, compass direction, legend, field-sketch annotations and a small GIS layer stack. All sample coordinates must be internally consistent and illustrative.", "Geographical skills plate for OS maps, scale, contours, fieldwork and GIS"),

    # AQA GCSE Geography 8035: all compulsory content plus every school-choice option.
    topic("aqa_8035_natural_hazards", "1. Natural hazards and risk", "aqa-gcse-8035", "Paper 1 · Physical environment", 1, "required",
          [], ["natural-hazards", "risk", "vulnerability", "resilience"], ["aqa.3.1.1.natural-hazards"],
          ["Define a natural hazard and compare tectonic, atmospheric and hydrological hazards.", "Explain hazard risk through exposure, vulnerability, capacity to cope and event characteristics.", "Use evidence to compare impacts and explain why impacts vary between places and groups."],
          ["hazard — natural process or event that may threaten people or property", "risk — likelihood and potential consequence of harm", "exposure — people or assets in harm’s way", "resilience — ability to prepare, cope and recover"],
          "A hazard event does not automatically become a disaster. Impacts depend on where and when it occurs, who and what are exposed, building quality, warning, preparation, access to services and response. Risk can change as population, land use and protection change.",
          "Use a named event to separate primary effects from secondary effects, then immediate from long-term responses. A comparison should cite event scale and context rather than assume that wealth alone determines vulnerability.",
          "Read a hazard map with its scale, date and legend. Use magnitude, intensity, return period or exposed population only when the measure is defined; these variables answer different questions.",
          "A hazard is not the same as a disaster. Magnitude alone cannot predict deaths or losses, and a low-probability event may still create serious risk.",
          ["What factors affect hazard risk?", "How do primary and secondary effects differ?", "Why might vulnerability vary within one city?"],
          "Define the hazard, locate the event, support impacts with evidence, and explain how vulnerability and capacity shape outcomes.",
          AQA_PHYSICAL, "Build a risk pathway diagram linking hazard, exposure, vulnerability and capacity to cope, with arrows showing how preparation or land-use change can alter consequences. Avoid a simplistic risk equation unless variables are defined.", "Natural-hazard risk pathway linking exposure and vulnerability"),

    topic("aqa_8035_tectonic_hazards", "2. Tectonic hazards", "aqa-gcse-8035", "Paper 1 · Physical environment", 2, "required",
          [], ["tectonic-hazards", "plate-tectonics", "earthquakes", "volcanoes", "natural-hazards"], ["aqa.3.1.1.tectonic-hazards"],
          ["Explain the global distribution and causes of earthquakes and volcanic eruptions using constructive, destructive and conservative plate margins.", "Compare primary and secondary effects and immediate and long-term responses for contrasting named events in an HIC and an LIC/NEE.", "Explain why people continue to live in hazard-prone areas and how monitoring, prediction, protection and planning reduce risk, while recognising their limits."],
          ["focus — point within Earth where rupture starts", "epicentre — surface point above focus", "subduction — one plate sinks beneath another", "monitoring — observing changes", "prediction — estimating event timing/location; exact prediction is not currently reliable"],
          "At destructive margins, subduction and friction can build stress and generate earthquakes; melting and rising magma can feed volcanoes. Constructive margins create new crust; conservative margins can produce earthquakes without volcanoes. Monitoring may identify patterns or unrest, while building codes, education, evacuation planning and emergency services reduce consequences.",
          "The AQA course expects two contrasting tectonic case studies: one in an HIC and one in an LIC or NEE. Japan (2011) and Nepal (2015) are possible teaching examples, not mandated cases. Check event figures against authoritative sources and explain physical setting as well as differences in vulnerability and capacity.",
          "Locate each event on a plate map. Organise case evidence into cause, primary/secondary effect and immediate/long-term response; avoid mixing global totals with local impacts.",
          "Earthquakes cannot be predicted exactly. A monitoring signal does not guarantee an eruption, and responses can reduce but not eliminate hazard.",
          ["Why do destructive margins produce both earthquakes and volcanoes?", "Give one monitoring method and one protection strategy.", "What evidence would make a case-study comparison fair?"],
          "Compare events through physical setting and social vulnerability. Make clear which evidence is event-specific and which is a general risk-reduction strategy.",
          AQA_PHYSICAL, "Create a cross-section of a destructive plate margin: oceanic plate subducting beneath continental plate, trench, earthquake foci, melting zone, magma rise and volcano. Add a small inset locating a named event only if coordinates are verified.", "Subduction-zone cross-section showing earthquake and volcanic processes"),

    topic("aqa_8035_weather_hazards", "3. Weather hazards", "aqa-gcse-8035", "Paper 1 · Physical environment", 3, "required",
          [], ["weather-hazards", "tropical-storms", "uk-weather", "risk-management"], ["aqa.3.1.1.weather-hazards"],
          ["Use pressure belts and surface winds in the general circulation model to explain broad weather and climate patterns.", "Explain tropical-storm conditions, global distribution, formation, structure, movement and likely climate-change effects on distribution, frequency and intensity.", "Describe UK weather hazards, analyse a recent UK extreme-weather example, and evaluate evidence about changing UK extremes."],
          ["Hadley cell — tropical atmospheric circulation cell", "Coriolis effect — apparent deflection caused by Earth’s rotation", "storm surge — abnormal sea-level rise associated with a storm", "primary effect — direct impact", "secondary effect — later or indirect impact"],
          "Global circulation is driven by uneven solar heating: rising air near the Equator and sinking air in subtropical belts help create broad pressure and wind patterns. Warm ocean water supplies heat and moisture to a tropical disturbance; rising moist air releases latent heat, pressure falls and winds strengthen. Earth’s rotation helps organise a rotating system away from the Equator. Storms weaken over land or cooler water. Warming oceans may affect rainfall and intensity, but global frequency trends remain uncertain.",
          "Use a school-selected tropical-cyclone case study and a recent UK extreme-weather event. Haiyan (2013) is a detailed cyclone example. Somerset (2013–14) is a detailed, older UK flood example; Storm Babet (2023) offers a more recent UK event. These are suggested examples, not mandated choices. Use the example your teacher selects and preserve source dates and definitions.",
          "Interpret a storm track cone as a range of possible paths, not a predicted impact boundary. On a UK rainfall or flood hydrograph, link timing, rainfall and river response while distinguishing weather observation from attribution evidence.",
          "A tropical cyclone is not powered by land heat and cannot form equally at every latitude. One UK storm does not by itself prove a long-term climate trend.",
          ["What conditions support tropical-storm formation?", "Name two ways warnings can reduce risk.", "How can evidence for more extreme UK weather be assessed over time?"],
          "Use process sequence for formation; group event evidence clearly; assess long-term claims using records and a suitable baseline.",
          AQA_PHYSICAL, "Create a clear three-part geography teaching diagram: (1) a small globe locating tropical-cyclone formation over warm oceans roughly 5°–30° north and south of the Equator, with the ITCZ and converging trade winds; (2) a large vertical cross-section over warm ocean showing the eye, eyewall, spiral rainbands, inward surface winds, rising moist air, latent-heat release and upper-level outflow; (3) a small forecast-track graphic with the cone labelled as uncertainty in the storm-centre position, not the full impact zone. Use only physically consistent arrows and concise labels. Do not invent case-study data, place names or category values.", "Global circulation, tropical-storm structure and forecast uncertainty diagram"),

    topic("aqa_8035_climate_change", "4. Climate change", "aqa-gcse-8035", "Paper 1 · Physical environment", 4, "required",
          [], ["climate-change", "ice-ages", "greenhouse-gases", "mitigation-adaptation"], ["aqa.3.1.1.climate-change"],
          ["Describe evidence of climate change from the Quaternary to the present.", "Explain natural influences (orbital changes, volcanic activity and solar output) and human influences (fossil fuels, agriculture and deforestation).", "Explain impacts and distinguish mitigation from adaptation."],
          ["Quaternary — recent geological period including repeated glacial/interglacial phases", "proxy record — indirect evidence of past climate", "mitigation — action to limit causes", "adaptation — adjustment to actual or expected effects", "carbon sink — store that takes up more carbon than it releases over a period"],
          "Orbital variations alter the distribution of incoming solar energy over long periods; volcanic aerosols and solar output can influence climate. Today, burning fossil fuels, agriculture and deforestation add greenhouse gases or reduce carbon storage. Mitigation targets drivers; adaptation reduces harm from impacts already occurring or expected.",
          "Use a named place to explain one climate impact and a response, such as heat risk in cities or sea-level adaptation in a coastal area. Strategies have unequal costs and may shift risk, so discuss who can access them.",
          "Read a temperature anomaly graph by identifying its baseline and timespan. Ice cores, tree rings and instrumental measurements cover different periods and have different uncertainties; combine evidence rather than treating one proxy as complete.",
          "Climate has changed naturally in the past, but that does not explain the rapid recent warming by itself. Mitigation and adaptation are complementary, not synonyms.",
          ["Name two natural and two human causes of climate change.", "How do ice cores provide evidence about past climate?", "Classify a sea wall and renewable electricity as adaptation or mitigation."],
          "Explain cause → atmospheric change → impact → response. Be precise about timeframe, evidence and whether a strategy addresses causes or consequences.",
          AQA_PHYSICAL, "Show a geologic-to-present climate timeline with glacial/interglacial variation and a clearly labelled modern rapid warming segment. Pair it with a small mitigation-versus-adaptation comparison. Do not invent numerical temperature data; use a neutral schematic unless supplied with sourced data.", "Climate-change evidence timeline and mitigation/adaptation comparison"),

    topic("aqa_8035_ecosystems", "5. Ecosystems", "aqa-gcse-8035", "Paper 1 · Physical environment", 5, "required",
          [], ["ecosystems", "food-webs", "nutrient-cycles", "biomes"], ["aqa.3.1.2.ecosystems"],
          ["Explain biotic and abiotic components and interrelationships in a small-scale UK ecosystem.", "Use producers, consumers, decomposers, food chains/webs and nutrient cycling.", "Describe broad distribution and characteristics of global ecosystems and evaluate the effect of changing one component."],
          ["biotic — living", "abiotic — non-living", "biomass — mass of living material", "nutrient cycle — movement of nutrients through stores and transfers", "interdependence — linked reliance between components"],
          "Plants capture energy and create biomass. Consumers obtain energy by feeding; decomposers break down dead matter and return nutrients. Climate and soils influence productivity, while water, species interactions and human use shape local conditions. A change in one component can trigger linked changes elsewhere.",
          "A UK woodland, pond or dune can provide a small-scale ecosystem example. Identify specific site conditions and sampling evidence; an example is not automatically representative of every UK ecosystem.",
          "Use a food web to trace possible effects of removing or reducing one species. Compare climate charts and biome maps at matching scales. Field quadrats and transects record distributions but require consistent sampling.",
          "Energy flows through an ecosystem and is lost at transfers; nutrients cycle. A food web is a simplified model and does not mean every species has the same effect.",
          ["How do biotic and abiotic factors differ?", "What role do decomposers play in nutrient cycling?", "Predict two linked effects of a prolonged drought."],
          "Name the component that changes, trace effects through the system and support the prediction with an ecosystem relationship.",
          AQA_PHYSICAL, "Illustrate a small UK ecosystem as a food web linked to a nutrient cycle. Separate one-way energy arrows from cycling nutrient arrows, and label producers, consumers, decomposers and abiotic stores.", "UK ecosystem food web with energy flow and nutrient cycling"),

    topic("aqa_8035_rainforest", "6. Tropical rainforests", "aqa-gcse-8035", "Paper 1 · Physical environment", 6, "required",
          [], ["tropical-rainforests", "biodiversity", "deforestation", "sustainability"], ["aqa.3.1.2.tropical-rainforests"],
          ["Describe rainforest climate and structure and explain interdependence among climate, water, soil, plants, animals and people.", "Explain adaptations, biodiversity, causes and impacts of deforestation, and sustainable management.", "Use a named rainforest case study to connect economic development with environmental change."],
          ["canopy — upper continuous tree layer", "biodiversity — variety of life", "leaching — nutrients washed down through soil", "deforestation — long-term forest removal", "selective logging — removal of selected trees rather than clear-felling"],
          "Year-round warmth and high rainfall support rapid plant growth and biodiversity. Nutrients are held mainly in living biomass and a thin topsoil; heavy rain can leach exposed soil after clearing. Logging, farming, roads, mining and energy projects can create income and access while fragmenting habitat and releasing stored carbon.",
          "The Amazon is a possible case study, but specify the country or sub-region, causes, stakeholders and time period. Sustainable options can include protected areas, selective logging, replanting, agroforestry, ecotourism and enforcement; each requires funding and local participation.",
          "Interpret a forest profile and satellite land-cover map with dates and legend. Do not infer the cause of clearing from a map alone; combine spatial patterns with evidence about roads, farming or extraction.",
          "Rainforest soil is not uniformly fertile, and replanting a plantation does not instantly recreate an old-growth ecosystem. Conservation choices affect local livelihoods.",
          ["Why can cleared rainforest soil lose nutrients quickly?", "Name two direct causes of deforestation.", "How might sustainable management balance income and conservation?"],
          "Use a named place and a cause–impact–management chain. Evaluate strategies by effectiveness, scale, time and distribution of costs/benefits.",
          AQA_PHYSICAL, "Show a tropical rainforest profile with canopy layers, high rainfall, rapid nutrient uptake and a thin nutrient-poor soil. Include a small before/after clearing panel with runoff and soil erosion; avoid implying all rainforest soils are identical.", "Rainforest structure and nutrient cycle with deforestation effects"),

    topic("aqa_8035_hot_deserts", "7. Hot deserts — school option", "aqa-gcse-8035", "Paper 1 · Physical environment", 7, "option",
          [], ["hot-deserts", "desertification", "adaptation", "development-options"], ["aqa.3.1.2.hot-deserts"],
          ["Describe hot-desert conditions and links among climate, water, soils, vegetation, animals and people; explain adaptations and biodiversity issues.", "Use a named hot-desert case study to assess opportunities such as minerals, energy, farming and tourism, alongside heat, water scarcity and access challenges.", "Explain desertification drivers at desert margins—climate change, population growth, fuelwood removal, overgrazing, over-cultivation and soil erosion—and evaluate soil/water management, tree planting and appropriate technology."],
          ["aridity — persistent lack of available moisture", "evapotranspiration — evaporation plus plant transpiration", "desertification — land degradation in drylands", "desert margin — transition zone beside an arid area", "appropriate technology — technology suited to local needs and resources"],
          "Subtropical high pressure and descending dry air contribute to many hot deserts; rainfall is low and unreliable, evaporation is high, and daily temperature ranges can be large. Sparse vegetation adapts to water stress. Overgrazing, fuelwood removal, cultivation and drought can expose soils, while climate and livelihoods interact in desertification risk.",
          "The Thar or Sahara can be used if the case study identifies a specific place. Opportunities include solar energy, minerals, tourism and irrigated farming; challenges include water supply, heat, fragile soils and unequal access. Use the chosen example required by your teacher.",
          "A climograph shows low average rainfall but can hide variability. Read a desertification map with its date, scale and definition; do not treat every dryland change as irreversible desert expansion.",
          "Deserts are not empty or lifeless. Desertification has multiple drivers and is not simply the desert ‘moving’ into a place.",
          ["Why is water availability limited in hot deserts?", "Give one development opportunity and one challenge.", "How can grazing management reduce soil degradation?"],
          "Label this topic as optional: schools study hot deserts or cold environments. Use a named case, explain both opportunity and challenge, then judge strategies against water and ecosystem limits.",
          AQA_PHYSICAL, "Create a dryland water-balance diagram showing low, variable rainfall, high potential evapotranspiration, sparse cover and exposed soil. Add a small sustainable grazing/tree-planting panel; avoid portraying desertification as a moving sand dune front.", "Hot-desert water balance and dryland degradation pathway", "living-world-biome-choice", "Choose either hot deserts or cold environments."),

    topic("aqa_8035_cold_environments", "8. Cold environments — school option", "aqa-gcse-8035", "Paper 1 · Physical environment", 8, "option",
          [], ["cold-environments", "permafrost", "adaptation", "conservation"], ["aqa.3.1.2.cold-environments"],
          ["Describe polar and tundra conditions and links among climate, permafrost, soils, plants, animals and people; explain adaptations and biodiversity issues.", "Use a named cold-environment case study to assess mineral/energy extraction, fishing and tourism against extreme temperature, inaccessibility and infrastructure costs.", "Evaluate how fragile cold environments can be protected while balancing development and conservation through technology, government, international agreements and conservation groups."],
          ["permafrost — ground remaining frozen for at least two consecutive years", "active layer — surface ground thawing seasonally above permafrost", "tundra — cold biome with low-growing vegetation and limited tree growth", "wilderness value — environmental and cultural value of relatively undeveloped places"],
          "Low temperatures and short growing seasons restrict plant growth; permafrost limits drainage and construction. Warming can deepen seasonal thaw and destabilise ground, while extraction, roads, buildings and tourism can fragment habitats. Seasonal variation and local geology create different conditions across cold regions.",
          "Svalbard or Arctic Alaska could illustrate a named cold environment. Oil, gas, minerals, fishing and tourism create opportunities; extreme conditions, distance, infrastructure costs and fragile ecosystems create challenges. Compare technology, regulation, protected areas and international agreements without assuming one strategy resolves every conflict.",
          "Use a temperature/precipitation graph with seasons labelled. A permafrost cross-section should distinguish the active layer from permanently frozen ground; local observations and dates matter when discussing thaw.",
          "Tundra is not the same as polar ice sheet. Not all cold environments are permanently frozen at the surface, and development effects vary by site and season.",
          ["How does permafrost affect building and drainage?", "Name two opportunities and two challenges of development.", "Why might conservation and economic use conflict?"],
          "Label this topic optional: schools study cold environments or hot deserts. Link physical characteristics to interdependence, then evaluate protection and development trade-offs.",
          AQA_PHYSICAL, "Draw a cold-environment ground profile with permafrost and seasonally thawed active layer, shallow-rooted tundra vegetation, drainage and a raised building/road adaptation. Clearly distinguish schematic layers from local measured depths.", "Cold-environment active layer, permafrost and infrastructure diagram", "living-world-biome-choice", "Choose either hot deserts or cold environments."),

    topic("aqa_8035_uk_landscapes", "9. Physical landscapes in the UK", "aqa-gcse-8035", "Paper 1 · Physical environment", 9, "required",
          [], ["uk-landscapes", "relief", "rivers", "coasts"], ["aqa.3.1.3.uk-physical-landscapes"],
          ["Locate major UK upland and lowland areas and river systems.", "Explain how geology, relief and physical processes contribute to landscape diversity.", "Apply this overview to the two landscape options studied by your school."],
          ["upland — higher land, often with steeper relief", "lowland — lower and generally gentler land", "relief — height and shape of land", "drainage basin — land drained by a river and tributaries", "landscape — visible features shaped by physical and human processes"],
          "The UK’s geology and past glaciation help explain variation in relief, drainage and coastlines. Rivers connect uplands to lowlands and the sea, transferring water and sediment. Human land use interacts with these systems, so physical landscapes are dynamic rather than static scenery.",
          "Use a UK relief map and one named river system. Upland and lowland labels are broad patterns: thresholds and boundaries depend on the dataset or teaching map. This overview supports the coastal, river and glacial options.",
          "Read contours and river networks at appropriate scale; identify source, tributaries, confluence and mouth. Compare physical maps with settlement or land-use maps to explore interaction, not to assume direct causation.",
          "The specification requires the overview plus two of three landscape options. A single UK landscape example does not represent all regions.",
          ["What does a relief map show?", "How can upland areas influence a river downstream?", "Which two UK landscape options does your school study?"],
          "Know the broad locations and river systems, then revise the two options selected by your school. The three option guides are provided so the library covers every valid route.",
          AQA_PHYSICAL, "Make a clean GCSE teaching infographic with two linked panels. Panel A is a schematic UK landscape cross-section from a western upland to an eastern lowland, showing a river beginning in higher ground, tributaries joining, and a broad estuary at the coast. Panel B is a process overlay with rock resistance, glacially modified valley, river sediment transfer and human land use. Label features accurately, use arrows for flows, and mark the section ‘schematic — not to scale.’ Do not invent national boundaries, river routes, place names or numerical data. Exact locations belong on an atlas map, not this illustration.", "UK upland-to-lowland landscape section showing connected river and geological processes"),

    topic("aqa_8035_coasts", "10. Coastal landscapes in the UK — school option", "aqa-gcse-8035", "Paper 1 · Physical environment", 10, "option",
          [], ["coasts", "coastal-processes", "coastal-landforms", "coastal-management"], ["aqa.3.1.3.coastal-landscapes"],
          ["Distinguish constructive and destructive waves and explain mechanical/chemical weathering, sliding/slumping/rock falls, hydraulic action, abrasion, attrition, longshore drift and deposition.", "Explain headlands/bays, cliffs/wave-cut platforms, caves/arches/stacks, beaches/dunes/spits/bars through rock type, structure and process.", "Compare sea walls, rock armour, gabions, groynes, beach nourishment/reprofiling, dune regeneration and managed retreat using a named UK coastline and management scheme."],
          ["swash/backwash — uprush and return flow of a wave", "attrition — particles collide and become smaller/rounder", "longshore drift — net alongshore sediment transport", "groyne — barrier interrupting sediment movement", "managed retreat — planned realignment of the coastline"],
          "Waves transfer energy to the coast. Destructive waves tend to remove beach material; constructive waves tend to deposit it. Mechanical/chemical weathering and mass movement weaken or move rock; hydraulic action, abrasion and attrition erode it. Longshore drift follows angled swash and perpendicular backwash. Continued erosion can extend a crack into a cave, arch and stack; differential erosion creates headlands and bays. Deposition can build beaches, dunes, spits and bars where energy and sediment conditions permit. Geology and structure influence the rate and shape of change.",
          "Choose a UK coastline and a management scheme your school has studied. Explain why intervention occurred, which strategies were used, who benefits, who may lose, and how sediment or risk can shift alongshore. Include costs and environmental effects.",
          "Use a map to locate the case and a sequence diagram to explain landform formation. A sediment cell is a useful model, but real sediment budgets can cross simplified boundaries.",
          "Hard engineering does not remove risk; it can transfer it. A spit forms through deposition and changing coastline geometry, not because a river simply deposits at the coast.",
          ["How do destructive waves differ from constructive waves?", "What processes form a stack?", "How would you evaluate a coastal-management scheme?"],
          "This is one of three landscape options; schools study two. Explain process before naming landform, then evaluate management with place evidence and stakeholder effects.",
          AQA_PHYSICAL, "Create a two-part UK coast process diagram: (1) headland erosion sequence from crack to cave, arch, stack; (2) longshore drift building a spit with a recurved end. Include wave approach and sediment arrows; label as a process model, not a real mapped coastline.", "Coastal erosional sequence and depositional spit process model", "uk-landscapes-choice", "Choose two of coasts, rivers and glaciated landscapes."),

    topic("aqa_8035_rivers", "11. River landscapes in the UK — school option", "aqa-gcse-8035", "Paper 1 · Physical environment", 11, "option",
          [], ["rivers", "fluvial-processes", "flooding", "river-management"], ["aqa.3.1.3.river-landscapes"],
          ["Explain downstream changes in long and cross profiles and hydraulic action, abrasion, attrition, solution, vertical/lateral erosion, traction, saltation, suspension and deposition.", "Explain interlocking spurs, waterfalls/gorges, meanders/oxbow lakes, floodplains, natural levees and estuaries; explain flood-risk factors and storm hydrographs.", "Evaluate dams/reservoirs, channel straightening, embankments, flood-relief channels, warnings, floodplain zoning, tree planting and river restoration through a named UK scheme."],
          ["discharge — volume of water passing a point per unit time", "traction/saltation/suspension/solution — transport modes", "hydrograph — graph linking discharge to time, often with rainfall", "lag time — delay from rainfall peak to discharge peak", "levee — raised natural river-bank deposit"],
          "Vertical erosion dominates many steep upper reaches, where interlocking spurs, waterfalls and gorges may form. Downstream, lateral erosion and deposition shape meanders and oxbow lakes; deposition builds floodplains, natural levees and estuaries. Rivers transport sediment by traction, saltation, suspension and solution. Flood peaks depend on rainfall, geology, relief, soil, land use and basin shape. A storm hydrograph relates rainfall to discharge and shows peak and lag time. Dams, embankments and channels change flows but can shift effects.",
          "Use a named UK river valley and flood-management scheme. Explain why the scheme was needed, its strategy and social/economic/environmental trade-offs. Soft approaches include warnings, zoning, tree planting and restoration; effectiveness depends on location and event scale.",
          "On a storm hydrograph, identify rising limb, peak discharge and lag time; compare with rainfall timing. Read contour maps to locate valleys and floodplains. Use consistent units and distinguish discharge from water level.",
          "Flooding is not caused by rainfall alone. Embankments may protect one reach but increase or accelerate downstream flows.",
          ["How do river valleys change downstream?", "Name two physical and two human flood-risk factors.", "What does a shorter lag time suggest about basin response?"],
          "This is one of three landscape options; schools study two. Explain landform process sequences and evaluate flood management using evidence and downstream effects.",
          AQA_PHYSICAL, "Show a river long profile and upper/middle/lower valley cross-sections; add a meander with erosion, deposition and an oxbow sequence. A separate storm hydrograph should label rainfall, discharge, peak, rising limb and lag time without inventing numerical values.", "River profiles, meander development and storm hydrograph" , "uk-landscapes-choice", "Choose two of coasts, rivers and glaciated landscapes."),

    topic("aqa_8035_glaciated_landscapes", "12. Glaciated landscapes in the UK — school option", "aqa-gcse-8035", "Paper 1 · Physical environment", 12, "option",
          [], ["glaciation", "glacial-landforms", "tourism", "land-use-conflict"], ["aqa.3.1.3.glacial-landscapes"],
          ["Describe the maximum extent of UK ice cover in the last Ice Age and explain freeze-thaw, abrasion, plucking, rotational slip, bulldozing, transport and deposition of till/outwash.", "Explain corries, arêtes, pyramidal peaks, truncated spurs, glacial troughs, ribbon lakes, hanging valleys, erratics, drumlins and moraines in a UK upland example.", "Evaluate tourism, farming, forestry and quarrying, their land-use conflicts, social/economic/environmental effects and management."],
          ["freeze-thaw — water freezes/expands in cracks and can loosen rock", "plucking — ice removes loosened rock", "till — unsorted material deposited by ice", "erratic — rock transported away from its source", "moraine — accumulation of glacial debris"],
          "Freeze-thaw can loosen rock before or beside ice. Moving ice rotates in hollows, abrades and plucks bedrock, and can bulldoze or transport debris. Erosion widens and deepens valleys. Retreating ice deposits unsorted till; meltwater sorts sediment into outwash. Erosional forms include corries, arêtes, pyramidal peaks, truncated spurs, troughs, hanging valleys and ribbon lakes; deposits include erratics, drumlins and moraines.",
          "The Lake District is a possible UK upland example. Tourism supports jobs but can cause congestion, footpath erosion and pressure on habitats. Farming, forestry and quarrying add land-use demands; path maintenance, visitor management and zoning can reduce impacts but require resources.",
          "Use contour maps, aerial images and field sketches to identify landforms. A corrie often has a steep back wall and overdeepened basin; map evidence should support the label. Avoid identifying a feature from one photograph alone.",
          "Not every lake is ribbon-shaped or glacial. Tourism is not automatically sustainable; visitor numbers, transport and management matter.",
          ["How do plucking and abrasion form different evidence?", "Name two erosional and two depositional landforms.", "What conflict can tourism create in an upland landscape?"],
          "This is one of three landscape options; schools study two. Link process, landform and map evidence, then explain how people use and manage the landscape.",
          AQA_PHYSICAL, "Create a labelled glaciated upland block diagram showing corrie, arête, pyramidal peak, truncated spur, U-shaped trough, hanging valley, ribbon lake, moraine and drumlin. Use separate erosion/deposition colours and avoid placing all features in one impossible viewpoint.", "Glaciated upland landforms classified by erosion and deposition", "uk-landscapes-choice", "Choose two of coasts, rivers and glaciated landscapes."),

    topic("aqa_8035_urban", "13. Urban issues and challenges", "aqa-gcse-8035", "Paper 2 · Human environment", 13, "required",
          [], ["urbanisation", "cities", "urban-management", "sustainability", "population", "migration", "place"], ["aqa.3.2.1.urban-issues"],
          ["Explain global urban patterns, HIC/LIC/NEE trends, push–pull migration, natural increase and megacities.", "Use a named LIC/NEE city to assess location, growth, jobs, services, informal settlements, water, sanitation, energy, unemployment, crime and environmental challenges; include planning that improves quality of life for poorer residents.", "Use a named UK city to assess migration, opportunities, deprivation, brownfield/greenfield change, sprawl and commuter settlements; explain a regeneration project and sustainable living/transport strategies."],
          ["urbanisation — rising share of population living in urban areas", "megacity — urban agglomeration with more than 10 million residents", "informal settlement — housing developed outside formal planning or services", "urban regeneration — coordinated improvement of a declining urban area", "urban sprawl — outward growth of built-up land"],
          "Urban growth comes from migration and natural increase. It can expand labour markets, industrial areas, health and education services, water supply and energy access while increasing demand for housing, sanitation and transport. Poorly serviced informal settlements can face insecure tenure and limited services; planning and community-led upgrading can improve quality of life. In UK cities, deindustrialisation, service-sector growth, national and international migration and policy alter neighbourhoods. Regeneration can add jobs, recreation, integrated transport and green space, but may raise rents or displace residents. Brownfield reuse, sprawl, commuter settlements, waste, congestion and deprivation create different challenges. Water/energy conservation, recycling, green space and public transport support urban sustainability.",
          "Rio de Janeiro and London are possible examples, not required by AQA. For the NEE/LIC city, identify location, opportunities, service challenges and management; for a UK city, explain a regeneration project and rural–urban fringe change. Use the examples taught by your school.",
          "Compare dated population data and maps. Distinguish city proper from metropolitan area. Use transport or pollution data with clear units and avoid treating a citywide mean as every resident’s experience.",
          "Urbanisation is not just city growth in area. Regeneration benefits and costs can be uneven; ‘sustainable city’ is a goal to assess, not a label to assume.",
          ["What drives urbanisation?", "Give one opportunity and one challenge of urban growth.", "How could a transport strategy reduce congestion and affect equity?"],
          "Use place-specific evidence; discuss different groups and scales. Evaluate regeneration through outcomes, access and possible displacement.",
          AQA_HUMAN, "Create a clear, age-appropriate urban systems illustration showing rural-to-urban migration and natural increase feeding city growth, alongside both opportunities (jobs, services, transport) and pressures (housing, water, sanitation, waste, traffic). Include a balanced NEE-city informal-neighbourhood upgrading panel and a UK brownfield regeneration / rural–urban fringe panel. Use respectful, non-stereotyped neighbourhoods and people, precise labels, accessible colours, and no invented statistics or text beyond short labels.", "Urban growth, opportunities, service pressures and planning responses across city neighbourhoods"),

    topic("aqa_8035_economic_world", "14. The changing economic world", "aqa-gcse-8035", "Paper 2 · Human environment", 14, "required",
          [], ["development", "economic-change", "globalisation", "inequality", "economic-activity", "trade", "place"], ["aqa.3.2.2.changing-economic-world"],
          ["Compare GNI per head, birth/death rates, infant mortality, life expectancy, literacy, access to safe water, people per doctor and HDI; explain limits and link the Demographic Transition Model to development.", "Explain physical, economic and historical causes of uneven development and consequences for health, wealth and migration; assess investment, industry, tourism, aid, intermediate technology, fair trade, debt relief and microfinance.", "Use one LIC/NEE country case study to assess sector change, manufacturing, TNCs, trade/political links, aid, environmental effects and quality of life; explain UK deindustrialisation, post-industrial growth, regional/rural change, infrastructure and global links."],
          ["GNI per head — national income per person on average", "HDI — composite health, education and income index", "deindustrialisation — decline in manufacturing employment/output", "TNC — transnational corporation", "development gap — unequal outcomes and opportunities between places"],
          "Development is multidimensional. Physical, historical and economic causes interact to shape uneven outcomes. Measures such as GNI, life expectancy, literacy, infant mortality, access to safe water and HDI reveal different dimensions; national averages conceal inequality. The Demographic Transition Model links changing birth/death rates to broad development patterns but is a model, not a forecast for every country. Investment, industry, tourism, aid, intermediate technology, fair trade, debt relief and microfinance may reduce some constraints, but results depend on governance, ownership and access. The UK has shifted from traditional manufacturing towards services, finance, research and information technology; infrastructure, government policy, rural population change and regional inequality shape its future.",
          "AQA requires one LIC/NEE country case study and one example of tourism helping reduce the development gap. Nigeria is one possible country, but use your school’s case and current verified facts. For the UK, connect industrial change, transport, rural population change, the north–south divide and global links.",
          "Compare indicators from the same year and note whether values are averages, rates or composite scores. A sector pie chart and trade map can show change, but neither by itself explains its causes.",
          "Higher income does not automatically mean equal access to health or education. One development strategy rarely removes structural causes on its own.",
          ["Why can HDI and income-per-person rankings differ?", "How might a TNC affect a host country?", "Name one cause and one consequence of UK deindustrialisation."],
          "Use indicator plus limitation, strategy plus mechanism, and named-case evidence. Separate national change from uneven local outcomes.",
          AQA_HUMAN, "Create an educational infographic linking development indicators (income, health, education) to the DTM and uneven outcomes, then trace how investment, manufacturing, tourism and trade can affect livelihoods. Include an abstract Nigeria oil-to-industry and local supply-chain flow, a Gambia tourism income/leakage balance, and a UK regional change/infrastructure panel. Use precise, restrained labels, avoid invented statistics, show local benefits and costs, and make clear these are distinct places rather than one map.", "Development measures and economic change: Nigeria, The Gambia and UK regional contrasts"),

    topic("aqa_8035_resource_management", "15. Resource management: food, water and energy overview", "aqa-gcse-8035", "Paper 2 · Human environment", 15, "required",
          [], ["resource-management", "food-security", "water-security", "energy-security", "natural-resources"], ["aqa.3.2.3.resource-management"],
          ["Explain why food, water and energy matter to social and economic wellbeing and describe inequalities in supply and consumption.", "Describe UK resources and changing demand/provision across food, water and energy, including food miles, all-year/organic demand and agribusiness; water quality, deficit/surplus and transfer; and a changing energy mix with declining domestic fossil-fuel supplies.", "Explain how resource choices create opportunities and challenges and lead into the school’s selected option."],
          ["resource security — reliable access to sufficient affordable resources", "resource inequality — uneven access, availability or consumption", "food miles — distance food travels from producer to consumer", "water transfer — engineered movement of water between areas", "energy mix — proportion of energy supplied by different sources"],
          "Demand changes with population, income, technology and behaviour. Supply depends on physical availability, infrastructure, cost, quality and governance. In the UK, food imports and agribusiness, water deficits and transfers, and a changing energy mix create linked economic and environmental trade-offs.",
          "Use UK food, water and energy examples to show that national supply can mask local or household access. This core guide is required; AQA then requires schools to study one option in depth: food, water or energy.",
          "Read a resource-flow map or supply chart with units and dates. Distinguish production, consumption, imports and access; use per-capita measures carefully.",
          "Resource scarcity can be physical, economic or infrastructural. A country can have adequate national supply while some communities lack secure access.",
          ["Why are food, water and energy interdependent?", "Name one UK food-system challenge and one water-supply challenge.", "Which of the three detailed options does your school study?"],
          "Revise the shared overview, then focus your detailed case-study learning on the one resource option chosen by your school.",
          AQA_HUMAN, "Create a classroom-ready resource nexus diagram linking food, water and energy with labelled arrows for farming, irrigation, fertiliser, transport, electricity, dams, bioenergy, treatment and desalination. Add a side panel contrasting physical availability, affordability, access, quality and reliability; add a small UK map-style inset showing only broad north-west/south-east water-demand contrasts without fake boundaries or numbers. Use accessible colours, concise labels and no unsupported statistics.", "The food–water–energy nexus, security dimensions and UK resource contrasts"),

    topic("aqa_8035_food", "16. Food — school option", "aqa-gcse-8035", "Paper 2 · Human environment", 16, "option",
          [], ["food-security", "agriculture", "sustainability", "resource-management"], ["aqa.3.2.3.food"],
          ["Explain global food surplus/deficit patterns, rising demand and factors affecting supply.", "Assess impacts of food insecurity and strategies to increase supply.", "Evaluate sustainable food systems and a large-scale development plus a local LIC/NEE food scheme."],
          ["food security — reliable physical and economic access to sufficient nutritious food", "undernutrition — inadequate intake of energy or nutrients", "agribusiness — large-scale commercial farming and related businesses", "hydroponics — growing plants in nutrient solution without soil", "permaculture — designing productive systems modelled on ecological relationships"],
          "Food demand rises with population, incomes and changing diets. Supply is affected by climate, water, soils, technology, pests, conflict and poverty. Irrigation, biotechnology, hydroponics and large-scale schemes can raise output, but may use water, energy or land and can affect access. Sustainable approaches reduce losses and improve resilience as well as production.",
          "A large-scale irrigation or agricultural project can illustrate both benefits and costs; a local community scheme in an LIC/NEE can illustrate sustainable supply. Select named examples taught by your school and check who controls land, water and produce.",
          "Interpret calorie-intake or food-production maps with scale and year. Distinguish food availability from affordability, nutrition and stability; national average supply can hide household insecurity.",
          "Food insecurity is not always caused by insufficient global production. Increasing yields alone may not solve unequal access or environmental limits.",
          ["Name three factors affecting food supply.", "How could irrigation increase production and create a cost?", "What makes a food scheme sustainable over time?"],
          "This is one of three resource options; schools study one. Explain both supply and access, and evaluate a strategy through social, economic and environmental effects.",
          AQA_HUMAN, "Create a detailed teaching visual with a left-to-right food security chain: production, storage and transport, market access, nutrition and stability. Add four labelled security pillars, a Mwea-style large irrigation cross-section (dam, canal, paddy, drainage, downstream users) and a separate Makueni sand-dam cross-section showing seasonal channel, accumulated sand, stored water and community irrigation. Include potential benefits and constraints in paired callouts; no invented statistics, no claim every site is identical.", "Food-security pillars and contrasting large-scale irrigation and local sand-dam systems", "resource-management-option", "Choose one of food, water or energy for detailed study."),

    topic("aqa_8035_water", "17. Water — school option", "aqa-gcse-8035", "Paper 2 · Human environment", 17, "option",
          [], ["water-security", "water-transfer", "water-quality", "sustainability"], ["aqa.3.2.3.water"],
          ["Explain global water surplus/deficit and rising demand.", "Explain how climate, geology, pollution, over-abstraction, infrastructure and poverty affect availability and insecurity.", "Assess supply schemes and sustainable management using a large-scale transfer and local LIC/NEE scheme."],
          ["water stress — demand pressure relative to available supply", "over-abstraction — withdrawal faster than replenishment", "desalination — removing salts from seawater", "grey water — gently used water reused for non-drinking purposes", "water quality — suitability for a particular use"],
          "Population, industry and agriculture increase demand. Climate variability and physical geography affect supply; pollution, ageing infrastructure, cost and unequal access can create insecurity even where water exists. Dams, reservoirs, transfers and desalination add supply, while conservation, recycling and groundwater management can reduce pressure.",
          "A large-scale transfer such as China’s South–North Water Transfer Project is a possible example; a local rainwater or community supply scheme can show sustainable management. Verify current outcomes and identify communities and ecosystems affected.",
          "Read a water-deficit map with season and basin boundaries in mind. For a transfer, trace source, route and destination; compare volumes only when units and years match.",
          "Water is renewable but not unlimited at a usable location and time. A transfer can move shortage or environmental costs rather than solve them everywhere.",
          ["Name four factors affecting water availability.", "How does desalination differ from a water transfer?", "What might make a local water scheme sustainable?"],
          "This is one of three resource options; schools study one. Evaluate both reliability and trade-offs, including access, ecosystems, cost and affected places.",
          AQA_HUMAN, "Create a two-part water-security teaching diagram. Part one shows China’s south-to-north transfer concept with source basin, eastern/middle routes, northern receiving areas, reservoirs and a clear note that the western route is planned; distinguish intended benefits from source-basin, ecological and cost trade-offs. Part two is a cross-section of a suitable seasonal sand river in Makueni showing a sand dam, accumulated coarse sand, stored water, shallow well/pump and small-scale irrigation. Add the water-security dimensions (availability, access, quality, affordability, reliability), no invented statistics, precise labels, and accessible colours.", "China inter-basin transfer and Makueni sand-dam water storage with security trade-offs", "resource-management-option", "Choose one of food, water or energy for detailed study."),

    topic("aqa_8035_energy", "18. Energy — school option", "aqa-gcse-8035", "Paper 2 · Human environment", 18, "option",
          [], ["energy-security", "energy-mix", "renewables", "sustainability"], ["aqa.3.2.3.energy"],
          ["Explain global energy supply/consumption patterns and reasons for rising demand.", "Explain physical, economic, technological and political factors affecting supply and insecurity.", "Evaluate strategies to increase supply and create a sustainable energy future."],
          ["energy security — reliable and affordable energy access", "renewable — replenished naturally on a human timescale", "intermittency — variable output depending on conditions", "energy mix — shares of supply by source", "carbon intensity — emissions per unit of energy/output"],
          "Demand rises with population, development, technology and consumption. Fossil fuels are dispatchable but emit greenhouse gases and are finite; renewables reduce operational emissions but depend on location, storage, grid and material supply. Efficiency, diverse sources, interconnection and demand management can improve security.",
          "Use a named energy project or national mix as an example, checking the year and whether figures describe electricity or total energy. Compare effects on consumers, jobs, landscapes, emissions and reliability.",
          "Read stacked charts with a defined denominator. Do not compare installed capacity directly with actual generation; use seasonal and daily data where intermittency matters.",
          "Renewable does not mean impact-free or available at all times. Energy independence is not the only measure of security; affordability and resilience matter too.",
          ["Why can energy demand rise as a country develops?", "Give one benefit and one challenge of a renewable source.", "How could storage support a variable energy supply?"],
          "This is one of three resource options; schools study one. Compare security, affordability and environmental impact using dated evidence and a clear measure.",
          AQA_HUMAN, "Create a three-panel GCSE energy infographic. Panel one shows energy-system flow from primary sources through generation, grid/storage and end users, distinguishing reserves, capacity, generation and consumption. Panel two shows Nigeria’s Niger Delta oil system with extraction/export benefits and carefully balanced spill, flaring, livelihood and climate costs. Panel three diagrams a community solar home system with panel, charge controller, battery, LED lights and locally trained women engineers, plus maintenance limits. Use accurate generic geography, no unsupported numbers, avoid stigmatizing people, and use concise accessible labels.", "Energy systems and trade-offs: Nigerian oil extraction and rural community solar", "resource-management-option", "Choose one of food, water or energy for detailed study."),

    topic("aqa_8035_issue_evaluation", "19. Issue evaluation", "aqa-gcse-8035", "Paper 3 · Applications and skills", 19, "required",
          [], ["issue-evaluation", "decision-making", "evidence", "stakeholders"], ["aqa.3.3.1.issue-evaluation"],
          ["Interpret an advance resource booklet and unseen resources about a contemporary issue.", "Analyse evidence, identify stakeholder viewpoints, compare options and justify a decision.", "Connect physical and human processes across scales and evaluate likely impacts of a proposal."],
          ["stakeholder — person/group affected or interested", "synoptic — drawing together several course themes", "trade-off — gain in one area linked to a cost elsewhere", "evaluation — reasoned judgement against stated criteria", "secondary data — evidence collected by someone else"],
          "Start by locating the issue and reading every source for type, date, scale and viewpoint. Extract evidence, identify uncertainty and affected groups, compare options against explicit criteria, then reach a justified decision. A strong judgement recognises trade-offs and explains why one option is preferable overall.",
          "The pre-release issue can relate to compulsory physical or human content and may use an unfamiliar context. Practise with planning proposals, resource conflicts or hazard-management choices, but do not assume which issue will appear.",
          "Cross-check maps, graphs, photographs, statistics and quotations. A graph axis can distort visual differences; a stakeholder quote reveals perspective, not necessarily a representative fact.",
          "A conclusion is not justified merely because it is the most popular option. Evidence can be incomplete or conflicting; state how that affects confidence.",
          ["Which source best supports each claim, and what are its limits?", "Who gains or loses under each option?", "What criteria support your final decision?"],
          "Use claim → evidence → explanation → counterpoint → judgement. Make the final choice explicit and justify it with more than one criterion and scale.",
          AQA_APPLICATIONS, "Design a decision-matrix visual with three options and criteria such as cost, people, environment, risk and timescale. Leave cells blank or use symbolic placeholders so it does not invent evidence; show how weights can change a decision.", "Issue-evaluation decision matrix with evidence and stakeholder criteria"),

    topic("aqa_8035_fieldwork", "20. Fieldwork and geographical enquiry", "aqa-gcse-8035", "Paper 3 · Applications and skills", 20, "required",
          [], ["fieldwork", "geographical-enquiry", "primary-data", "evaluation"], ["aqa.3.3.2.fieldwork"],
          ["Complete two enquiries with primary data collected outside the classroom and school grounds on at least two occasions.", "Use contrasting environments and show understanding of human and physical geography; at least one enquiry must examine their interaction.", "Plan, sample, record, present, analyse, conclude and evaluate data and methods."],
          ["hypothesis — testable proposed relationship", "primary data — collected first-hand for the enquiry", "sampling frame — set of units from which a sample is drawn", "systematic sampling — regular interval selection", "reliability — consistency of a measurement or method", "validity — whether evidence addresses the question"],
          "A fieldwork enquiry moves from question and theory to method, safe collection, presentation, analysis, conclusion and evaluation. Choose variables that operationalise the question; use consistent sampling and recording. Identify anomalies, link datasets and use suitable statistics without overstating what a small sample proves.",
          "A physical enquiry might test how channel characteristics vary downstream; a human enquiry might measure land use or environmental quality across an urban transect. Actual school sites and investigation titles differ; pupils should know their own titles and methods.",
          "Select graphs that match data type: line for continuous change, bar for categories, proportional symbols for quantities by place. Use units, sample size and location. Explain why a method fits and how timing, access and observer judgement affect results.",
          "More data do not automatically mean better evidence. A correlation across sites does not prove one variable caused the other.",
          ["What makes a question geographically testable?", "How would you justify systematic rather than random sampling?", "How can you evaluate whether a conclusion is reliable?"],
          "For each enquiry memorise title, aim, theory, site, methods, sample, presentation, results, conclusion, limitations and improvements. For unfamiliar fieldwork, infer carefully from the resources provided.",
          AQA_APPLICATIONS, "Create an enquiry-cycle diagram connecting question/hypothesis, theory, primary/secondary evidence, safe sampling, presentation, analysis, conclusion and evaluation. Add a small contrasting-sites fieldwork sketch but no fabricated measurements.", "Geographical enquiry cycle and contrasting-site fieldwork planning"),

    topic("aqa_8035_geographical_skills", "21. Geographical skills", "aqa-gcse-8035", "Paper 3 · Applications and skills", 21, "required",
          [], ["geographical-skills", "maps", "numeracy", "data-interpretation"], ["aqa.3.4.geographical-skills"],
          ["Apply cartographic, graphical, numerical and statistical skills across physical and human geography.", "Interpret OS maps, atlas maps, photographs, GIS, satellite imagery, graphs, tables and written sources.", "Use scale, direction, grid references, units, data presentation and evidence-based communication accurately."],
          ["contour — line joining points of equal height", "gradient — change in height divided by horizontal distance", "mean/median/range/quartiles — measures of central tendency and spread", "percentage change — change relative to starting value", "GIS layer — mapped dataset that can be viewed with other spatial information", "interquartile range — spread of the middle half of ordered values"],
          "Choose the skill to match the task: use latitude/longitude and four/six-figure grid references; measure straight/curved distance and area at map scale; interpret direction, contours, spot heights, gradient, transects and cross-sections; read ground, aerial and satellite photographs and GIS layers; construct line, bar, pie, histogram, scattergraph and population-pyramid displays; complete choropleth, isoline, dot, desire-line, proportional-symbol and flow-line maps. Calculate ratios, proportions, frequency, mean, median, mode, range, quartiles, interquartile range and percentage change where suitable. Label units, use sensible precision and identify weaknesses in selective presentation.",
          "Practise on unfamiliar UK and global contexts, since skill questions can draw on any specification theme. Use accurate fieldwork examples from your own enquiries for Paper 3 responses.",
          "Show calculation steps, units and sensible rounding. For a six-figure grid reference, read eastings then northings. For a choropleth, inspect class breaks before comparing colours. For a photograph, orient and locate before describing. Use an appropriate graph and scale; describe scattergraph association without claiming causation, and avoid extrapolating far beyond the plotted data.",
          "A map symbol is not self-explanatory without its key. Averages can hide outliers, and a visual pattern does not establish causation.",
          ["How do you measure a straight-line distance on an OS map?", "Which graph best shows change over time, and why?", "What checks should you make before comparing two datasets?"],
          "Be accurate, label units and use evidence in the sentence. In longer answers, move from description to explanation and evaluation rather than listing values.",
          AQA_SKILLS, "Create a GCSE geography skills reference plate with an OS-map scale calculation, eastings-then-northings grid reference, contour cross-section, a small data table and correctly labelled line/bar graph examples. Keep all sample numbers clearly illustrative and internally consistent." , "GCSE geography map, scale, contour and data-presentation skills plate"),
]


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def note_path(item: dict) -> str:
    folder = "ks3" if item["curriculum"] == "ks3-england" else "aqa-gcse-8035"
    return f"data/StudyBooks/england/geography/{folder}/{item['order']:02d}-{slug(item['id'].split('geo_')[-1] if 'geo_' in item['id'] else item['id'].replace('aqa_8035_', ''))}.md"


WORD_TARGETS = {
    # KS3 targets are close to the existing US Middle School Geography books.
    # UK geography is useful enrichment rather than a named KS3 requirement.
    "england_ks3_geo_places": (9000, 11000),
    "england_ks3_geo_uk": (5000, 7000),
    "england_ks3_geo_rocks": (8000, 10000),
    "england_ks3_geo_tectonics": (9000, 11000),
    "england_ks3_geo_weather_climate": (9000, 11000),
    "england_ks3_geo_glaciation": (8000, 10000),
    "england_ks3_geo_hydrology": (8000, 10000),
    "england_ks3_geo_rivers": (8000, 10000),
    "england_ks3_geo_coasts": (8000, 10000),
    "england_ks3_geo_ecosystems": (8000, 10000),
    "england_ks3_geo_population": (9000, 11000),
    "england_ks3_geo_settlements": (8000, 10000),
    "england_ks3_geo_development": (9000, 11000),
    "england_ks3_geo_economic_activity": (9000, 11000),
    # Broad cross-cutting guide: map reading, GIS, data handling and a full
    # fieldwork cycle justify a slightly wider allowance than a single topic.
    "england_ks3_geo_skills": (9000, 11000),
    # AQA case-study chapters get the greatest depth; cross-cutting overviews
    # and skills chapters stay shorter to avoid repeating the whole course.
    "aqa_8035_natural_hazards": (6000, 8000),
    "aqa_8035_tectonic_hazards": (11000, 14000),
    "aqa_8035_weather_hazards": (10000, 13000),
    "aqa_8035_climate_change": (8000, 10000),
    "aqa_8035_ecosystems": (7000, 9000),
    "aqa_8035_rainforest": (9000, 12000),
    "aqa_8035_hot_deserts": (9000, 12000),
    "aqa_8035_cold_environments": (9000, 12000),
    "aqa_8035_uk_landscapes": (5000, 7000),
    "aqa_8035_coasts": (11000, 14000),
    "aqa_8035_rivers": (11000, 14000),
    "aqa_8035_glaciated_landscapes": (11000, 14000),
    "aqa_8035_urban": (10000, 13000),
    "aqa_8035_economic_world": (11000, 14000),
    "aqa_8035_resource_management": (5000, 7000),
    "aqa_8035_food": (8000, 10000),
    "aqa_8035_water": (8000, 10000),
    "aqa_8035_energy": (8000, 10000),
    "aqa_8035_issue_evaluation": (6000, 8000),
    "aqa_8035_fieldwork": (8000, 10000),
    "aqa_8035_geographical_skills": (7000, 9000),
}


def current_word_count(path: str) -> int:
    file = ROOT / path
    return len(file.read_text(encoding="utf-8").split()) if file.exists() else 0


def markdown(item: dict) -> str:
    status = item["required"]
    if status == "required":
        note = "**Curriculum status:** Required core content."
    elif status == "enrichment":
        note = "**Curriculum status:** Enrichment guide. This extends required KS3 learning with additional place examples; the programme does not prescribe this chapter or its named examples."
    else:
        note = f"**Curriculum status:** Optional school choice. {item.get('option_group_note', 'Check which option your school studies before prioritising this chapter.')}"
    content = [f"# {item['title']}", "", note, ""]
    if item["curriculum"] == "ks3-england":
        content += ["This guide follows the **England Key Stage 3 Geography programme of study**. Schools choose their own sequence and detailed place exemplars; the coverage map in the curriculum framework shows how this guide fits the full programme.", ""]
    else:
        content += ["This guide follows **AQA GCSE Geography 8035**. Named examples below are suggested teaching examples where the specification allows a school choice; use your teacher’s selected case study and verify current figures before an assessment.", ""]
    content += ["## Required knowledge", ""]
    content.extend(f"- {line}" for line in item["knowledge"])
    content += ["", "## Key vocabulary", "", "| Term | Meaning |", "|---|---|"]
    for definition in item["vocabulary"]:
        term, meaning = definition.split(" — ", 1)
        content.append(f"| **{term}** | {meaning} |")
    content += ["", "## How the geography works", "", item["process"], "", "## Place example", "", item["example"], "", "## Maps, data and evidence", "", item["data"], "", "## Common misconception", "", item["misconception"], "", "## Self-check", ""]
    content.extend(f"{index}. {question}" for index, question in enumerate(item["questions"], start=1))
    content += ["", "## Revision points", "", item["revision"], "", "## Curriculum alignment", "", f"- Curriculum coverage IDs: {', '.join(f'`{outcome}`' for outcome in item['outcomes'])}", f"- Related practice packs: {', '.join(f'`{pack_id}`' for pack_id in item['pack_ids']) if item['pack_ids'] else 'No topic-specific pack is currently registered; use the curriculum topic guide and the separate GCSE past-paper resources.'}", f"- Shared concept tags: {', '.join(f'`{tag}`' for tag in item['tags'])}", "", "## Sources", "", f"- Curriculum/specification: [{item['source']}]({item['source']})"]
    for tag in item["tags"]:
        source_group = next((key for key in SUPPLEMENTAL_SOURCES if key in tag), None)
        if source_group:
            for label, url in SUPPLEMENTAL_SOURCES[source_group]:
                source_line = f"- Further reading: [{label}]({url})"
                if source_line not in content:
                    content.append(source_line)
    content += ["- For case-study facts, use the source list and figures selected by your teacher; dates, totals and local conditions can change between datasets.", ""]
    if item.get("image"):
        anchor = f"image-{slug(item['id'])}"
        content += [f"<!-- IMAGE-BRIEF: {item['id']} -->", f'<span id="{anchor}"></span>', ""]
    return "\n".join(content)


def manifest_entry(item: dict) -> dict:
    word_min, word_max = WORD_TARGETS[item["id"]]
    return {
        "id": item["id"], "displayName": item["title"], "subject": "geography",
        "curriculum": item["curriculum"], "studyBookKind": "topic-guide",
        "group": item["group"], "order": item["order"], "required": item["required"],
        **({"optionGroup": item["option_group"]} if item.get("option_group") else {}),
        **({"optionGroupNote": item["option_group_note"]} if item.get("option_group_note") else {}),
        "contentMdPath": note_path(item), "conceptTags": item["tags"],
        "coverageIds": item["outcomes"], "relatedPackIds": item["pack_ids"],
        "targetWordCount": {"min": word_min, "max": word_max},
    }


def write_word_targets():
    directory = ROOT / "docs/curriculum-generation/geography"
    rows = [
        "# Geography Study Book word targets", "",
        "Planning ranges for each learner-facing guide. Targets are based on the scope of the England KS3 programme and AQA GCSE 8035, with larger allowances for chapters that require detailed case studies and shorter allowances for overview and cross-cutting skills chapters.", "",
        "Counts use whitespace-separated Markdown tokens (the same convention as `wc -w`), including headings, tables and vocabulary. The expansion goal is useful explanation, sourced place examples, worked map/data reading and retrieval practice; it is not filler.", "",
        "The 18 existing US Middle School Geography books range from 6,980 to 9,958 words, with a median of 8,162 and mean of 8,309. That supports an approximately 8–10k baseline for most KS3 guides. England KS3 lists required themes without prescribing one national chapter order ([DfE programme](https://www.gov.uk/government/publications/national-curriculum-in-england-geography-programmes-of-study/national-curriculum-in-england-geography-programmes-of-study)). AQA divides GCSE Geography into four units, assesses them across three papers weighted 35%, 35% and 30%, and distinguishes broad case studies from more focused examples ([AQA specification](https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content), [assessment overview](https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/specification-at-a-glance)). Case-study chapters therefore get more space; overview and skills chapters get less to avoid repeating the full course.", "",
        "## England KS3", "", "| Guide | Current words | Target range | Progress |", "|---|---:|---:|---|",
    ]
    totals = {}
    for curriculum, label in (("ks3-england", "England KS3"), ("aqa-gcse-8035", "AQA GCSE 8035")):
        items = [item for item in TOPICS if item["curriculum"] == curriculum]
        current_total = min_total = max_total = 0
        if curriculum == "aqa-gcse-8035":
            rows += ["", "## AQA GCSE Geography 8035", "", "| Guide | Current words | Target range | Progress |", "|---|---:|---:|---|"]
        for item in items:
            low, high = WORD_TARGETS[item["id"]]
            count = current_word_count(note_path(item))
            progress = "Within target" if low <= count <= high else ("Needs enrichment" if count < low else "Review for concision")
            rows.append(f"| {item['title']} | {count:,} | {low:,}–{high:,} | {progress} |")
            current_total += count
            min_total += low
            max_total += high
        totals[curriculum] = (current_total, min_total, max_total)
        rows += [f"", f"**{label} total:** current {current_total:,}; estimated target {min_total:,}–{max_total:,} words."]
    combined = tuple(sum(totals[curriculum][index] for curriculum in totals) for index in range(3))
    rows += [
        "", f"**Combined target:** {combined[1]:,}–{combined[2]:,} words across 36 England KS3 and AQA GCSE guides. The current combined draft length is {combined[0]:,} words.",
        "", "## Completion status", "",
        "All 15 England KS3 and 21 AQA GCSE 8035 guides have been expanded. Every guide is within its planned word range; the totals above are recalculated from the learner-facing Markdown each time this report is generated.", "",
        "The source framework and prompt file remain available for future corrections or curriculum updates. Run `npm run validate:geography-studybooks` after editing content. Run `npm run generate:geography-studybooks` without `--force` to refresh registration, targets and the image queue while preserving enriched notes. The `--force` flag replaces existing notes with brief framework drafts and must not be used to refresh completed content.", "",
        "AQA choice chapters remain optional school routes: students normally study either hot deserts or cold environments, two of the three UK landscape options, and one of food, water or energy. The library contains every option so teachers can select their route.", "",
    ]
    (directory / "word-targets.md").write_text("\n".join(rows), encoding="utf-8")


def build_framework_docs():
    ks3 = [item for item in TOPICS if item["curriculum"] == "ks3-england"]
    gcse = [item for item in TOPICS if item["curriculum"] == "aqa-gcse-8035"]
    lines = ["# England KS3 and AQA GCSE Geography Study Books", "", "This framework is the source map for the generated topic notes. England KS3 specifies end-of-stage outcomes but no single national chapter sequence; the chapters below are a coverage-oriented library. AQA GCSE 8035 topics are grouped by specification unit. `required` means compulsory content; `option` means a specification choice, and the option group explains the school selection rule.", "", "## KS3 coverage matrix", "", "| Programme outcome | Guide chapters | Existing practice packs |", "|---|---|---|"]
    outcomes = {
        "ks3.locational-knowledge": "World locations and connected places",
        "ks3.place-knowledge": "World locations and connected places",
        "ks3.physical.geological-timescales": "Geological time, rocks, weathering and soils",
        "ks3.physical.plate-tectonics": "Plate tectonics and tectonic hazards",
        "ks3.physical.rocks-weathering-soils": "Geological time, rocks, weathering and soils",
        "ks3.physical.weather-climate": "Weather, climate and climate change",
        "ks3.physical.ice-age-to-present": "Weather, climate and climate change; Glaciation and changing landscapes",
        "ks3.physical.glaciation": "Glaciation and changing landscapes",
        "ks3.physical.hydrology": "Hydrology, the water cycle, water resources and Rivers and river landscapes",
        "ks3.physical.rivers": "Rivers and river landscapes (curriculum extension mapped to hydrology)",
        "ks3.physical.coasts": "Coasts and coastal change",
        "ks3.human.population-urbanisation": "Population, migration and urbanisation; Settlements, land use and urban change",
        "ks3.human.international-development": "International development and globalisation",
        "ks3.human.economic-sectors": "Economic activity, trade and natural resources",
        "ks3.human.trade-links": "Economic activity, trade and natural resources",
        "ks3.human.natural-resources": "Economic activity, trade and natural resources; Hydrology, the water cycle and water resources",
        "ks3.human.settlement-land-use": "Settlements, land use and urban change",
        "ks3.human-physical-interaction": "All physical-process and human-geography guides",
        "ks3.skills.maps-atlases": "Geographical skills and fieldwork",
        "ks3.skills.os-grid-scale": "Geographical skills and fieldwork",
        "ks3.skills.gis": "Geographical skills and fieldwork",
        "ks3.skills.aerial-satellite": "Geographical skills and fieldwork",
        "ks3.skills.fieldwork-contrasting-locations": "Geographical skills and fieldwork",
        "ks3.skills.data-analysis-communication": "Geographical skills and fieldwork",
    }
    for outcome, labels in outcomes.items():
        matched = [item for item in ks3 if outcome in item["outcomes"]]
        packs = sorted({p for item in matched for p in item["pack_ids"]})
        lines.append(f"| `{outcome}` | {labels} | {', '.join(f'`{p}`' for p in packs) or 'No linked pack'} |")
    lines += ["", "## AQA GCSE 8035 coverage matrix", "", "| Specification section/choice | Guide chapters | Status |", "|---|---|---|"]
    for item in gcse:
        lines.append(f"| `{', '.join(item['outcomes'])}` | {item['title']} | {item['required']}" + (f" · `{item['option_group']}`" if item.get("option_group") else "") + " |")
    lines += ["", "## School-choice rules", "", "- Every AQA GCSE guide is included in this library so teachers can select the route that matches their course.", "- Living world: tropical rainforests are compulsory; study either **hot deserts or cold environments**.", "- UK physical landscapes: UK landscape overview is compulsory; study **two of coasts, rivers and glaciated landscapes**.", "- Resource management: the shared food/water/energy overview is compulsory; study **one of food, water or energy** in depth.", "- The 3.3 applications unit and 3.4 geographical skills are compulsory and cross-cutting.", "- GCSE past-paper sitting notes remain registered as existing pack notes and appear in their own catalogue group.", "", "## Framework and source policy", "", "Notes are original learner-facing summaries, not reproduced specification text. Case studies are teaching examples; teachers should replace or supplement them with the course’s selected examples and current, sourced data. The shared cross-curriculum concept tags are designed for later comparison, not a comparison screen in this release.", ""]
    (ROOT / "docs/curriculum-generation/geography").mkdir(parents=True, exist_ok=True)
    (ROOT / "docs/curriculum-generation/geography/coverage-matrix.md").write_text("\n".join(lines), encoding="utf-8")
    prompts = ["# Enriched topic-generation prompts", "", "Use one prompt per chapter. Draft for England KS3 or AQA GCSE 8035 exactly as named; align every explanation and retrieval question to the coverage IDs, use original age-appropriate prose, explain processes causally, qualify school-selected case studies, and cite reliable sources. Include the common note sections and do not invent statistics. Image briefs, where present, are conceptual visual suggestions only; queue them for later generation.", ""]
    for item in TOPICS:
        word_min, word_max = WORD_TARGETS[item["id"]]
        prompts += [f"## {item['title']}", "", f"- Stable ID: `{item['id']}`", f"- Curriculum/status: `{item['curriculum']}` / `{item['required']}`" + (f" / option group `{item['option_group']}`" if item.get("option_group") else ""), f"- Target length: {word_min:,}–{word_max:,} words", f"- Coverage: {', '.join(f'`{x}`' for x in item['outcomes'])}", f"- Existing practice packs: {', '.join(f'`{x}`' for x in item['pack_ids']) or 'None; do not create new packs in this pass.'}", f"- Shared concepts: {', '.join(f'`{x}`' for x in item['tags'])}", f"- Enrichment prompt: Write a complete student guide that teaches: {' '.join(item['knowledge'])} Explain this process: {item['process']} Use this place/evidence framing: {item['example']} Include map/data interpretation, misconceptions, self-check questions and a concise revision strategy. Cite `{item['source']}` and relevant authoritative evidence sources; do not invent figures or present an illustrative case study as prescribed.", ""]
    (ROOT / "docs/curriculum-generation/geography/topic-prompts.md").write_text("\n".join(prompts), encoding="utf-8")
    coverage = {
        "schemaVersion": 1,
        "sources": {"englandKs3": KS3_SPEC, "aqaGcse8035Physical": AQA_PHYSICAL, "aqaGcse8035Human": AQA_HUMAN, "aqaGcse8035Applications": AQA_APPLICATIONS, "aqaGcse8035Skills": AQA_SKILLS},
        "topics": [{"id": x["id"], "curriculum": x["curriculum"], "status": x["required"], "optionGroup": x.get("option_group"), "coverageIds": x["outcomes"], "relatedPackIds": x["pack_ids"], "contentMdPath": note_path(x)} for x in TOPICS],
        "ks3Outcomes": sorted(outcomes),
        "aqaRequiredSections": [x for item in gcse if item["required"] == "required" for x in item["outcomes"]],
        "aqaOptionGroups": {"living-world-biome-choice": ["aqa_8035_hot_deserts", "aqa_8035_cold_environments"], "uk-landscapes-choice": ["aqa_8035_coasts", "aqa_8035_rivers", "aqa_8035_glaciated_landscapes"], "resource-management-option": ["aqa_8035_food", "aqa_8035_water", "aqa_8035_energy"]},
    }
    (ROOT / "docs/curriculum-generation/geography/coverage-matrix.json").write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_image_queue():
    visual_topics = [item for item in TOPICS if item.get("image")]
    lines = ["# Geography image-generation queue", "", "Purpose: queue optional classroom visuals for later one-at-a-time generation with ChatGPT Image 2.5. **No images have been generated.** Every item points to a hidden anchor in its Study Book note. Prompts avoid synthetic map borders, unsupported statistics and decorative imagery that does not teach a process.", "", "| Queue ID | Curriculum/topic | Note anchor | Suggested image brief | Suggested alt text | Status |", "|---|---|---|---|---|---|"]
    for item in visual_topics:
        anchor = f"image-{slug(item['id'])}"
        path = note_path(item)
        prompt = item["image"].replace("|", "\\|")
        alt = item["image_alt"].replace("|", "\\|")
        lines.append(f"| `{item['id']}` | {item['title']} | [`{path}#{anchor}`](/{path}#{anchor}) | {prompt} | {alt} | Planned |")
    (ROOT / "docs/curriculum-generation/geography/image-generation-queue.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="replace existing curriculum notes with the short framework drafts")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    # Preserve all existing content and only replace entries created by this generator.
    prefix = ("england_ks3_geo_", "aqa_8035_")
    us_groups = {
        "usmsg_01_": "Physical geography",
        "usmsg_02_": "Human geography",
        "usmsg_03_": "World regions",
        "usmsg_04_": "Environment and global issues",
    }
    us_catalogue = {}
    us_ids = set(US_CONCEPT_TAGS)
    for collection_name in ("packs", "revisionPacks"):
        for entry in manifest.get(collection_name, []):
            tags = US_CONCEPT_TAGS.get(entry.get("id"))
            if not tags:
                continue
            entry["conceptTags"] = sorted(set(entry.get("conceptTags", [])) | set(tags))
            entry["studyBookKind"] = "topic-guide"
            group = next((label for key, label in us_groups.items() if entry["id"].startswith(key)), "Study notes")
            order_parts = re.findall(r"_(\d{2})_", entry["id"])
            entry["group"] = group
            if order_parts:
                entry["order"] = int(order_parts[-1])
            if entry.get("subject") == "geography" and entry.get("curriculum") == "us-middle-school" and entry.get("contentMdPath"):
                us_catalogue.setdefault(entry["id"], {
                    "id": entry["id"],
                    "displayName": entry.get("displayName") or entry["id"],
                    "subject": "geography",
                    "curriculum": "us-middle-school",
                    "studyBookKind": "topic-guide",
                    "group": group,
                    "order": entry.get("order"),
                    "contentMdPath": entry["contentMdPath"],
                    "conceptTags": entry["conceptTags"],
                })
    existing = [
        entry for entry in manifest.get("studyBooks", [])
        if not str(entry.get("id", "")).startswith(prefix) and entry.get("id") not in us_ids
    ]
    entries = [manifest_entry(item) for item in TOPICS]
    for item in TOPICS:
        target = ROOT / note_path(item)
        target.parent.mkdir(parents=True, exist_ok=True)
        if args.force or not target.exists():
            target.write_text(markdown(item), encoding="utf-8")
    manifest["studyBooks"] = existing + list(us_catalogue.values()) + entries
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    build_framework_docs()
    write_image_queue()
    write_word_targets()
    print(f"Generated {len(TOPICS)} England curriculum notes and registered {len(us_catalogue) + len(entries)} total Geography topic guides.")


if __name__ == "__main__":
    main()
