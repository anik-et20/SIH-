import re
from datetime import datetime, date, timedelta
from typing import Optional, Tuple
from schemas import ResolvedDate

WEEKDAYS = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1, "tues": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3, "thur": 3, "thurs": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6
}

def resolve_date_string(date_input: Optional[str] = "today", ref_date: Optional[date] = None) -> ResolvedDate:
    """
    Deterministically resolves a date query into a canonical ResolvedDate object.
    The LLM must never calculate dates itself.
    """
    if ref_date is None:
        ref_date = date.today()

    if not date_input:
        target = ref_date
        rel_desc = "today"
        offset = 0
    else:
        text = date_input.strip().lower()
        
        # 1. Direct standard keywords
        if text in ["today", "now", "current", "present"]:
            target = ref_date
            rel_desc = "today"
            offset = 0
        elif text in ["tomorrow", "tmrw"]:
            target = ref_date + timedelta(days=1)
            rel_desc = "tomorrow"
            offset = 1
        elif text in ["yesterday"]:
            target = ref_date - timedelta(days=1)
            rel_desc = "yesterday"
            offset = -1
        elif text in ["day after tomorrow", "overmorrow"]:
            target = ref_date + timedelta(days=2)
            rel_desc = "in 2 days"
            offset = 2
        elif text in ["day before yesterday"]:
            target = ref_date - timedelta(days=2)
            rel_desc = "2 days ago"
            offset = -2
        else:
            # 2. Match "in X days" or "after X days"
            in_days_match = re.search(r'(?:in|after)\s+(\d+)\s+days?', text)
            if in_days_match:
                n = int(in_days_match.group(1))
                target = ref_date + timedelta(days=n)
                rel_desc = f"in {n} days"
                offset = n
            else:
                # 3. Match "X days ago"
                days_ago_match = re.search(r'(\d+)\s+days?\s+ago', text)
                if days_ago_match:
                    n = int(days_ago_match.group(1))
                    target = ref_date - timedelta(days=n)
                    rel_desc = f"{n} days ago"
                    offset = -n
                else:
                    # 4. Match weekdays: "next monday", "this friday", "coming sunday", or just "monday"
                    weekday_matched = False
                    for name, day_num in WEEKDAYS.items():
                        pattern = rf'\b(?:next|this|coming)?\s*{name}\b'
                        if re.search(pattern, text):
                            current_weekday = ref_date.weekday()
                            days_ahead = day_num - current_weekday
                            if "next" in text:
                                if days_ahead <= 0:
                                    days_ahead += 7
                                else:
                                    days_ahead += 7 # next week's occurrence
                            else:
                                if days_ahead <= 0:
                                    days_ahead += 7
                            target = ref_date + timedelta(days=days_ahead)
                            rel_desc = f"{target.strftime('%A')} ({target.strftime('%b %d')})"
                            offset = (target - ref_date).days
                            weekday_matched = True
                            break
                    
                    if not weekday_matched:
                        # 5. Match ISO format YYYY-MM-DD or standard DD-MM-YYYY / MM-DD-YYYY
                        iso_match = re.search(r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b', text)
                        if iso_match:
                            try:
                                target = date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
                                offset = (target - ref_date).days
                                if offset == 0:
                                    rel_desc = "today"
                                elif offset == 1:
                                    rel_desc = "tomorrow"
                                elif offset == -1:
                                    rel_desc = "yesterday"
                                elif offset > 0:
                                    rel_desc = f"in {offset} days"
                                else:
                                    rel_desc = f"{abs(offset)} days ago"
                            except ValueError:
                                target = ref_date
                                rel_desc = "today"
                                offset = 0
                        else:
                            # Default fallback to today
                            target = ref_date
                            rel_desc = "today"
                            offset = 0

    is_forecast = offset >= 0
    is_historical = offset < 0
    # Open-Meteo forecast API supports up to 14 days in the future
    is_valid_forecast_range = -365 <= offset <= 16

    return ResolvedDate(
        date_str=target.strftime("%Y-%m-%d"),
        day_name=target.strftime("%A"),
        relative_description=rel_desc,
        day_offset=offset,
        is_forecast=is_forecast,
        is_historical=is_historical,
        is_valid_forecast_range=is_valid_forecast_range
    )
