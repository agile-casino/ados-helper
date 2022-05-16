import uniq from "lodash/uniq";
import sum from "lodash/sum";
import { Pie } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import "chart.js/auto";
import { getColourScheme } from "../utils/colourScheme";
import { formatName } from "../utils/formatName";
import { WorkItemDto } from "../api/queryRepository";

interface WorkItemChartProps {
    workItems: WorkItemDto[];
}

export function WorkItemChart({ workItems }: WorkItemChartProps) {

    const people = uniq(workItems?.map(x => x.System.AssignedTo)).sort();
    const points = people.map(x => sum(workItems?.filter(y => y.System.AssignedTo === x).map(z => z.Microsoft.VSTS.Scheduling.Effort)));

    const chartData: ChartData<"pie", number[], string> = {
        labels: people.map(x => formatName(x) ?? "Unassigned"),
        datasets: [{
          data: points,
          backgroundColor: getColourScheme(people.length - 1).concat("hsl(0, 0%, 50%)")
        }]
      };

    const chartOptions: ChartOptions<"pie"> = { 
        animation: { 
            duration: 0
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right"
            }
        }
    };

    return (
        <Pie data={chartData} options={chartOptions} />
    );
}
