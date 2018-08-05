// NOTE: We're not using babel here because custom elements don't work well with
//       babel (without 'babel-plugin-transform-builtin-classes').
// See https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Transpilers_versus_classes
const Chart = require('chart.js/dist/Chart.bundle.min.js')
const moment = require('moment')

const {setMinus} = require('./utils')


class TimeTracerReportView extends HTMLElement {

    constructor(settings, data) {
        super()

        const dataByTag = {}
        const xValues = new Set()
        const xValuesByTag = {}
        data.forEach(datum => {
            const {start, stop, tags} = datum
            const x = moment(start).format('YYYY-MM-DD')
            const y = moment.duration(moment(stop).diff(start)).asHours()
            for (const tag of tags) {
                if (!dataByTag[tag]) {
                    dataByTag[tag] = new Map()
                    xValuesByTag[tag] = new Set()
                }
                if (dataByTag[tag].has(x)) {
                    dataByTag[tag].set(x, dataByTag[tag].get(x) + y)
                }
                else {
                    dataByTag[tag].set(x, y)
                }
                xValues.add(x)
                xValuesByTag[tag].add(x)
            }
        })
        // Fill in empty values
        for (const [tag, tagData] of Object.entries(dataByTag)) {
            for (const missingX of setMinus(xValues, xValuesByTag[tag])) {
                console.log('filled', missingX, 'for', tag)
                tagData.set(missingX ,0)
            }
        }
        const datasets = Object.entries(dataByTag).map(([tag, tagData]) => {
            const color = settings.ui.preferedChartColors(tag)
            return {
                data: [...tagData.entries()].map(([x, y]) => ({x, y})),
                label: tag,
                fill: false,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1,
            }
        })

        const canvas = document.createElement('canvas')
        new Chart(canvas, {
            type: 'bar',
            data: {
                datasets,
            },
            options: {
                title: {
                    display: true,
                    text: settings.name,
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day',
                            unitStepSize: 1,
                            displayFormats: {
                               'day': 'MMM DD',
                           },
                        },
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true,
                    }],
                },
            },
        })

        this.appendChild(canvas)
    }

    getTitle() {
        return 'Time report'
    }
}

customElements.define('time-tracer-report', TimeTracerReportView)

module.exports = TimeTracerReportView