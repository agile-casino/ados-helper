import uniq from "lodash/uniq";
import sum from "lodash/sum";
import { Pie } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import "chart.js/auto";
import { WorkItemDetailsDto } from "../api/workItemsRepository";
import { getColourScheme } from "../utils/colourScheme";

interface WorkItemChartProps {
    workItems: WorkItemDetailsDto[];
}

export function WorkItemChart({ workItems }: WorkItemChartProps) {

    const people = uniq(workItems?.map(x => x.fields["System.AssignedTo"]?.displayName));
    const points = people.map(x => sum(workItems?.filter(y => y.fields["System.AssignedTo"]?.displayName === x).map(z => z.fields["Microsoft.VSTS.Scheduling.Effort"])));

    const chartData: ChartData<"pie", number[], string> = {
        labels: people,
        datasets: [{
          data: points,
          backgroundColor: getColourScheme(people.length)
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