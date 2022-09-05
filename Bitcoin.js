// {Name: Bitcoin}
// {Description: Gives Bitcoin price information, including visual charts of Bitcoin prices over the past week, month, and year.}

title('Bitcoin');

const DATE_FORMAT = 'YYYY-MM-DD';

intent(
    '(what was|what were|tell me|how much was|do you know|) (the|) Bitcoin (price_) (in the|over the|) past $(PERIOD week|month|year)',
    '(what is|what was|what were|do you know) the past $(PERIOD week|month|year) Bitcoin (price_)',
    'what (was|were) the Bitcoin (price_)',
    async p =>  {
        const period = p.PERIOD ? p.PERIOD.value : 'week';
        const start = getStartDate(period, p.timeZone);
        const end = api.moment().format(DATE_FORMAT);

        const data = await getHistoryData(period);
        console.log(data);

        if (!data || !data.prices) {
            return sendErrorMessage(p);
        }

        const values = [];
        const dates = [];

        data.prices.forEach(p => {
            const value = Math.trunc(p[1]);
            dates.push(api.moment(p[0]).format(DATE_FORMAT));
            values.push(value);
        });

        const max = Math.max(...values);
        const min = Math.min(...values);

        p.play({
            embeddedPage: true,
            page: 'bitcoin_example.html',
            command: 'newChart',
            values,
            dates,
        });
        p.play(
            `(For|Over) the past ${period} the lowest Bitcoin price was ${min} dollars and the highest Bitcoin price was ${max} dollars`,
            `The past ${period}'s lowest Bitcoin price was ${min} dollars and the highest Bitcoin price was ${max} dollars`,
        );
    }
);

intent(
    'how much is Bitcoin',
    '(what is|tell me|find|do you know|) (the|) (price of Bitcoin|Bitcoin price) (in|) $(CURRENCY dollar|dollars|pound|pounds|euro|euros|ruble|rubles|)',
    'how much is Bitcoin in $(CURRENCY dollar|dollars|pound|pounds|euro|euros|ruble|rubles)',
    'how many $(CURRENCY dollar|dollars|pound|pounds|euro|euros|ruble|rubles) (do I need|does it cost|are needed) to buy Bitcoin',
    async p => {
        const currencyCode = p.CURRENCY && p.CURRENCY.value ? getCurrencyCode(p.CURRENCY.value) : 'USD';
        const data = await getCurrentData(currencyCode);
        if (!data || !data[0] || !data[0].current_price) {
            return sendErrorMessage(p);
        }

        const price = Math.trunc(data[0].current_price);
        const currencyName = getCurrencyString(currencyCode);

        p.play(`The (current|) (Bitcoin price|price of Bitcoin) is ${price} ${currencyName}`);
    }
);

function getCurrencyString(currencyCode) {
    const values = {
        EUR: 'euros',
        RUB: 'rubles',
        GBP: 'pounds',
        USD: 'dollars',
    };
    return values[currencyCode];
}

function getCurrencyCode(currencyString) {
    const values = {
        euro: 'EUR',
        euros: 'EUR',
        pound: 'GBP',
        pounds: 'GBP',
        ruble: 'RUB',
        rubles: 'RUB',
        dollar: 'USD',
        dollars: 'USD',
    };
    return values[currencyString.toLowerCase()];
}

function getStartDate(period, timeZone) {
    return api.moment().tz(timeZone).subtract(1,   `${period}s`).format(DATE_FORMAT);
}

function sendErrorMessage(p) {
    p.play(
        `(Something went wrong.|) I (wasn't able to|couldn't) get the Bitcoin prices. (Please try again|Please try again later|)`,
        `I'm unable to get Bitcoin prices now. (Please try again|Please try again later|)`,
    );
}

async function getCurrentData(currencyCode) {
    const response = await api.axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currencyCode}&ids=bitcoin`);
    return response.data;
}


async function getHistoryData(period) {
    const to = Math.floor(Date.now() / 1000);
    let from;
    switch(period) {
        case "month":
            from = to - 30 * 24 * 3600; break;
        case "year":
            from = to - 365 * 24 * 3600; break;
        case "week":
            from = to - 7 * 24 * 3600; break;
        default:
            from = to;
    }
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;
    const response = await api.axios.get(url);
    return response.data;
}
