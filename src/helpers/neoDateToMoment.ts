import {DateTime} from "neo4j-driver";

const moment = require('moment');

export interface NeoLowHigh {
    low: number;
    high: number;
}

export interface NeoDate {
    day: NeoLowHigh;
    hour: NeoLowHigh;
    minute: NeoLowHigh;
    month: NeoLowHigh;
    second: NeoLowHigh;
    year: NeoLowHigh;
    timeZoneOffsetSeconds: NeoLowHigh;
    timeZoneId: number;
}

export function neoDateToMoment(neoDate: NeoDate, to: string = 'toDate'): Date {
    if (typeof neoDate === 'undefined' || !neoDate || typeof neoDate.year === 'undefined') {return neoDate as any; }

    return  parseDate(neoDate as any);
    // return  parseDate(neoDate as any);
/*    // const date = `${neoDate.year.low}-${neoDate.month.low}-${neoDate.day.low} ${neoDate.hour.low}:${neoDate.minute.low}:${neoDate.second.low}`;
    const m = moment(date, 'YYYY-MM-DD hh:mm:ss');
    if (!m) { return null;}

    if (to.length === 0) {
        return m;
    }

    console.log(date, ' ::: ', m[to](), ':::', new Date(date.toISOString()).getHours())
    return m[to]();*/
}


export const parseDate = (neo4jDateTime: DateTime): Date => {
    const { year, month, day, hour, minute, second, nanosecond } = neo4jDateTime;

    const date = new Date(
      year.toInt(),
      month.toInt() - 1, // neo4j dates start at 1, js dates start at 0
      day.toInt(),
      hour ? hour.toInt() : 0,
      minute ? minute?.toInt() : 0,
      second ? second.toInt() : 0,
      nanosecond ? nanosecond.toInt() / 1000000 : 0 // js dates use milliseconds
    );

    return date;
};

export function convertDateToString (
    date: any)
    : string {
    const date_values = [];
    for (const key in date) {
        const cursor = date[key];
        if (cursor) {
            date_values.push(cursor.toString());
        }
    }
    const the_date = new Date(...date_values as [number, number, number, number, number, number]);
    return the_date.toUTCString();
}
