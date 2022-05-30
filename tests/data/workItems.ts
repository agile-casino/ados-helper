export const workItemsResponse = {
  count: 14,
  value: [
    {
      id: 66001,
      rev: 22,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Sad Khalid Qayyum",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/44f84189-caa9-4497-89c5-8294f74af6fa",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
            },
          },
          id: "44f84189-caa9-4497-89c5-8294f74af6fa",
          uniqueName: "WFT\\E261018",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
        },
        "System.CreatedDate": "2020-02-26T16:19:06.91Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T12:19:13.443Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title": "[Raptor] Download Multiple Models",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 5609756.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div>Add the ability to download multiple models at once from the raptor model search table.</div><div>It should probably just zip them all up and download as a single zip file, as is done when downloading multiple files from a job.</div><div><br></div><div>For NVision, this will just be a zip file of all of the model .txt files.</div><div>For CO, this should be a zip file containing folders for each set of model files.</div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<ul><li>The user is able to download multiple models from the raptor model search page at once.</li><li>All of the selected models are combined and downloaded as a single .zip file.</li></ul>",
        "System.Tags": "Project/DSSWD-58391; Sprint 175+",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62712",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79638",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79639",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/66001",
    },
    {
      id: 76765,
      rev: 8,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.CreatedDate": "2021-10-15T15:25:39.143Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-26T13:27:13.95Z",
        "System.ChangedBy": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.CommentCount": 0,
        "System.Title": "[PreView to Cloud] Test Upload/Download Speeds",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935815926.0,
        "Microsoft.VSTS.Scheduling.Effort": 3.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div>Test upload/download speeds once everything is in Azure and working and compare to the current live environment.</div><div>Test from different locations around the world (maybe 5-6 locations across our key geozones) - can create Azure VMs in different locations for this.</div><div><br></div><div>Also note general file access times etc. to inform whether it might be worth setting the default storage to 'hot' instead of 'cool'.</div><div><br></div><div>If there are any concerning speed reductions, investigate within the size of this PBI and raise to POs/IT to see if there's anything that we can do.</div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Upload and Download speeds have been tested for PreView in Azure across a range of geographic locations and compared with the current live website.</li><li>Any concerning speed reductions have been noted and flagged up</li></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79930",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79793",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/76765",
    },
    {
      id: 76766,
      rev: 7,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2021-10-15T15:31:57.717Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T13:29:43.673Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Optimising cost structure / usage model",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935873515.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div>Test the performance of the (azure) website against the current live website to determine whether the specs for our resources are appropriate. We want to keep costs as low as possible whilst maintaining adequate performance on the website<b> (what constitutes adequate performance?)</b>.</div><div>May need to increase the specs on our dev resources temporarily to match our intentions for live.</div><div>Will likely require iterative tweaks to our infrastructure.</div><div>Would probably be a good idea to use the API performance tests as part of this.</div><div><br></div><div>This would involve things like:</div><div><ul><li>Speed of website loading</li><ul><li>e.g. how long does the wells page take to load</li></ul><li>Time taken to publish files</li><li>Real-time (is it actually real-time?)</li><ul><li>Time taken to upload FRT log (and publish DPK)</li></ul><li>Time to plot a large log</li></ul></div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          '<div><ul><li>We have tested the performance of our website in Azure.</li><li><span style="background-color:rgb(255, 255, 255);display:inline !important;">We are happy with the specs that we intend to deploy live, and may have made some tweaks/recommendations as appropriate.</span><br></li></ul></div>',
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79796",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79797",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/76766",
    },
    {
      id: 78688,
      rev: 13,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-03-07T15:09:03.79Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T12:34:08.43Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title": "[Raptor] Display WISE Number on Raptor table",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 6765491.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>It looks like there is a field in Greg\'s database that contains the WQ number for a particular model.</div><div>Show this number in a new column on the raptor model table (NVision and CO). There may not be a WQ for a given model, so just show a blank field in this case.</div><div>Of course we will need to add an appropriate field into our own database for this.</div><div><span style="background-color:rgb(255, 255, 255);display:inline !important;">Clicking on the number will open a link to the WQ in a new tab.</span><br></div><div><span style="background-color:rgb(255, 255, 255);display:inline !important;">Space is a premium on this table, so can we get away with naming the column just&nbsp; \'WISE\'?</span></div><div><br></div><div>Should the user be able to search on this field? Yes.</div><div><br></div><div>It looks like the WQ number is stored in the&nbsp;pdf_pdffield table which just looks to be a dump of all of the fields from every single job planner PDF that has been submitted, so is therefore a pretty large table and slow to query.</div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<ul><li>There is a new column on the raptor model table that shows the WQ number associated with the model (both NVision and CO).</li><ul><li>Clicking on the number opens a link to the WQ in a new tab.</li><li>The user is able to search for a given WQ number</li></ul></ul>",
        "System.Tags": "Project/DSSWD-58391; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79784",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79783",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62536",
          attributes: { isLocked: false, name: "Parent" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/78688",
    },
    {
      id: 79449,
      rev: 15,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CreatedDate": "2022-04-29T09:59:41.753Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-27T07:29:47.7Z",
        "System.ChangedBy": {
          displayName: "Head, Andrew",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/cc176263-01e8-4454-987e-d0bc7a98ea68",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjIxOTk4MA",
            },
          },
          id: "cc176263-01e8-4454-987e-d0bc7a98ea68",
          uniqueName: "WFT\\E128018",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjIxOTk4MA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjIxOTk4MA",
        },
        "System.CommentCount": 0,
        "System.Title": "[PreView] Live Update Q2 2022",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 5609700.0,
        "Microsoft.VSTS.Scheduling.Effort": 5.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div><div style="box-sizing:border-box;">Preparation, testing, and performing of the Q2 2022 live update. This update will be the release of Weatherford federated logins for PreView and PLUS2.</div><div style="box-sizing:border-box;"><ul style="box-sizing:border-box;padding:0px 0px 0px 40px;"><li style="box-sizing:border-box;">Update test documents</li><li style="box-sizing:border-box;">Exploratory testing</li><li style="box-sizing:border-box;">Merge to staging</li><li style="box-sizing:border-box;">PLUS2 Preparation</li><li style="box-sizing:border-box;">Test run 1</li><li style="box-sizing:border-box;">Rollback test</li><li style="box-sizing:border-box;">Test run 2&nbsp;</li><li style="box-sizing:border-box;">Live Update</li><li style="box-sizing:border-box;">PLUS2 Release</li></ul></div><br></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>PreView Data has been updated successfully</li><li>New version of PLUS2 released</li></ul></div>",
        "System.Tags": "EVP/P57281; Sprint 175",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79496",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79474",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79477",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79473",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79472",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79494",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79475",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79476",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62536",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79663",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79652",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79470",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79497",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79495",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79478",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79471",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79449",
    },
    {
      id: 79704,
      rev: 7,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-05-18T11:18:17.267Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T12:34:08.43Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Deprecated App Service Resources in Terraform",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935874962.0,
        "Microsoft.VSTS.Scheduling.Effort": 1.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>When running Terraform, we receive a warning that the app service resources on the azurerm provider have been deprecated.</div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/a8eccec7-e962-4f17-9a4a-c297d18b2829?fileName=image.png" alt=Image><br></div><div><br></div><div>Update the configuration to use the new versions of the affected resources.</div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Terraform config has been updated to use the newer app service resources</li><ul><li>No warnings when running a 'plan' or 'apply'</li></ul></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79798",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79704",
    },
    {
      id: 79719,
      rev: 12,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.CreatedDate": "2022-05-18T13:00:43.17Z",
        "System.CreatedBy": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.ChangedDate": "2022-05-24T12:19:26.32Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title": "[PreView to Cloud] Enable HTTP2 for cloud app service",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935803920.0,
        "Microsoft.VSTS.Scheduling.Effort": 1.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>Now that we have the website running in the cloud in an AppService, we can enable HTTP/2.0 which should give us slightly better performance loading the website.</div><div><br></div><div>This is an easy settings to change, we just need to: -</div><div><ul><li>enable it</li><li>do some tests to make sure everything works</li><li>update the Terraform config</li></ul></div><div>Enable for both website and Storage Service.</div><div><br></div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/27eedaae-c6a8-4ae5-a2f3-3ab4e0a8a44d?fileName=image.png" alt=Image><br></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Option 1</li><ul><li>HTTP/2.0 is enabled</li><li>Terraform is updated</li></ul><li>Option 2</li><ul><li>We have tried it, found that it doesn't work</li></ul></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 175+",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79779",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79719",
    },
    {
      id: 79747,
      rev: 8,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-05-19T15:46:35.893Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T12:34:08.43Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Deploy Service to VM: Admin Service and Housekeepers",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935808228.0,
        "Microsoft.VSTS.Scheduling.Effort": 1.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div style="box-sizing:border-box;">Deploy the following services to the app server VM in Azure (PreViewData-Dev-VM-AppServer):</div><div style="box-sizing:border-box;"><ul style="box-sizing:border-box;padding:0px 0px 0px 40px;"><li style="box-sizing:border-box;"><span style="box-sizing:border-box;">Admin Service</span></li><li style="box-sizing:border-box;"><span style="box-sizing:border-box;">File Housekeeper</span></li><li style="box-sizing:border-box;">User Housekeeper</li></ul></div><div style="box-sizing:border-box;"><span style="box-sizing:border-box;">Will involve lots of Octopus tweaks.</span></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          '<div>The following services are deployed and working on the PreView Azure site:</div><div><ul style="box-sizing:border-box;padding:0px 0px 0px 40px;background-color:rgb(255, 255, 255);"><li style="box-sizing:border-box;"><span style="box-sizing:border-box;">Admin Service</span></li><li style="box-sizing:border-box;"><span style="box-sizing:border-box;">File Housekeeper</span></li><li style="box-sizing:border-box;">User Housekeeper</li></ul></div>',
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79787",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79786",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79785",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79747",
    },
    {
      id: 79755,
      rev: 12,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Approved",
        "System.Reason": "Work stopped",
        "System.CreatedDate": "2022-05-20T08:36:59.47Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-26T14:41:18.087Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Authentication for VMs and Databases",
        "System.BoardColumn": "Approved",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935812924.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Approved",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Approved",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div><b><u>VM</u></b></div><div>Currently we just have a shared admin account for access to the cloud app server VM, I imagine there's a way to enable login with our AAD accounts, so look into doing that. Allowing AAD logins may require joining the VM to the domain so maybe not something we want to do? Maybe just separate accounts for each developer? Weigh up the pros and cons of having the VM on the domain.</div><div><br></div><div><u><b>Databases</b></u></div><div>We currently just have one database admin account that covers both the PreView and Data Mining database. We should probably have separate read/write user accounts like we do for the on-prem databases. Should we also have a separate user account for data mining? Maybe also a read user for data mining?</div><div><br></div><div>There will likely be Terraform changes to make for this as well.</div><div><br></div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>There are separate read/write/admin user accounts for the PreView Azure database</li><li>There are extra users account for data mining (admin/read)?</li><li>Able to log into the app server VM using AAD accounts or some other way that allows each user to log in separately.</li><li>&nbsp;Terraform config updated as appropriate</li></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 176-",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79790",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79789",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79755",
    },
    {
      id: 79763,
      rev: 10,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.CreatedDate": "2022-05-20T11:06:17.203Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-26T09:58:59.583Z",
        "System.ChangedBy": {
          displayName: "Aaron, Sarah",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/1d3cf566-f698-4696-8087-3902f3d2ffc2",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI4NjM4NQ",
            },
          },
          id: "1d3cf566-f698-4696-8087-3902f3d2ffc2",
          uniqueName: "WFT\\E156716",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI4NjM4NQ",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI4NjM4NQ",
        },
        "System.CommentCount": 0,
        "System.Title": "[Security] Unverified users can still access site",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935822378.0,
        "Microsoft.VSTS.Scheduling.Effort": 1.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>If not too involved, it would be nice if this would be hotfixed.</div><div><br></div><div>It seems that unverified users can easily bypass the need to reverify their email address by just changing the URL after logging in. This wasn\'t always the case so maybe it crept in during the .NET Core update. Fix.</div><div>Maybe there should also be some kind of test for this? Perhaps a new UI test?</div><div><br></div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/2d1a6fd5-a060-42e0-8f14-e0510493da94?fileName=UnverifiedUser_Bypass.gif" alt=Image><br></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Unverified users are unable to access the site until they have actually verified their email address.</li></ul></div>",
        "System.Tags": "Bug; EVO/P57205; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79794",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79795",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/78073",
          attributes: { isLocked: false, name: "Parent" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79763",
    },
    {
      id: 79765,
      rev: 9,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.AssignedTo": {
          displayName: "Sad Khalid Qayyum",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/44f84189-caa9-4497-89c5-8294f74af6fa",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
            },
          },
          id: "44f84189-caa9-4497-89c5-8294f74af6fa",
          uniqueName: "WFT\\E261018",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
        },
        "System.CreatedDate": "2022-05-20T12:44:32.727Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-25T10:37:45.26Z",
        "System.ChangedBy": {
          displayName: "Sad Khalid Qayyum",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/44f84189-caa9-4497-89c5-8294f74af6fa",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
            },
          },
          id: "44f84189-caa9-4497-89c5-8294f74af6fa",
          uniqueName: "WFT\\E261018",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjcxMzc1Mg",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Monitor currently unmonitored services",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935813924.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div>Server Monitor currently monitors the state of EventService by checking that number of messages in the eventservice message queue and making sure it's not above a certain number.</div><div>This won't work now that the event service queue is now on Azure Service Bus.</div><div>Update Server Monitor to be able to check the status of Event Service another way, perhaps by checking the state of the process? This would also allow monitoring of all of the other services that aren't currently covered by Server Manager or elsewhere.</div><div><br></div><div>Check what other services are currently unmonitored and add the same monitoring to them (and update the Acceptance Criteria)</div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<ul><li>Server Monitor (or something) monitors the state of all otherwise previously unmonitored PreView services and reports when they are down.</li><ul><li>Event Service</li><li>....</li></ul></ul>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79791",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79765",
    },
    {
      id: 79766,
      rev: 8,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-05-20T13:26:10.503Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-24T12:34:08.43Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title": "[PreView to Cloud] Update Storage Monitor for Azure",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935814924.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          "<div>Storage Monitor is a service that checks how much free space there is on our current NetApp storage volume.</div><div>Since we are moving our storage to Azure, this will need to be updated.</div><div><br></div><div>Update Storage Monitor to be able to check how much space is being used on the current Azure 'storage volume' (storage container in Azure) and switch to a new one if it reaches a particular limit. Perhaps it can also be updated to actually create the new storage container in Azure and add the new storage volume to PreView? This would save having to do this manually, which is what we currently have to do for NetApp (we would still want to be emailed so that we know this has happened).</div><div><br></div><div>Will also need to figure out what the container size limit should be? Currently each storage volume in NetApp is 1.5TB, but there might be a more suitable number for Azure. Maybe it would be based on number of files rather than total used space? Are there are any hard or soft limits on these numbers for a container in Azure?</div><div><br></div>",
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<ul><li>Storage Monitor has been updated to appropriately handle storage volumes in Azure.</li><ul><li>A sensible and justifiable limit has been set for storage volume/container size&nbsp;</li><li>Automatically creates the new storage volume and Azure container when the limit is reached<br></li><li>Automatically switches to a new volume when the limit is reached</li></ul></ul>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79792",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79766",
    },
    {
      id: 79778,
      rev: 11,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-05-23T13:41:33.77Z",
        "System.CreatedBy": {
          displayName: "Anthony Archer",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6ac6183e-4bc8-429d-9640-63ee541c05ba",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
            },
          },
          id: "6ac6183e-4bc8-429d-9640-63ee541c05ba",
          uniqueName: "WFT\\archerax",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjA5MDY3Mw",
        },
        "System.ChangedDate": "2022-05-24T12:34:08.43Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title":
          "[PreView to Cloud] Subscription reports are being sent from the future",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935812535.0,
        "Microsoft.VSTS.Scheduling.Effort": 1.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>Currently on the dev-cloud environment, event logs are showing subscription reports as being sent from the future.</div><div><br></div><div>This seems unlikely.</div><div><br></div><div>Subscriptions appear to be sent correctly (at 2pm uk time) so I think it\'s just something odd in the event logging.</div><div><br></div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/3a96b9df-c771-4c20-92eb-023b33486b6c?fileName=image.png" alt=Image style="width:576px;height:260px;" width=576 height=260><br></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Event log times for subscription reports are accurate</li></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79788",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79778",
    },
    {
      id: 79799,
      rev: 8,
      fields: {
        "System.AreaPath": "WirelineRnD\\Team Yellow",
        "System.TeamProject": "WirelineRnD",
        "System.IterationPath": "WirelineRnD\\Team Yellow\\Sprint 176",
        "System.WorkItemType": "Product Backlog Item",
        "System.State": "Committed",
        "System.Reason": "Commitment made by the team",
        "System.CreatedDate": "2022-05-24T13:50:26.377Z",
        "System.CreatedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.ChangedDate": "2022-05-26T14:51:46.74Z",
        "System.ChangedBy": {
          displayName: "Kennedy, Daniel E",
          url: "https://ados/WirelineRnD_Collection/_apis/Identities/6e2d42ae-728a-4ef3-8911-921a19de99db",
          _links: {
            avatar: {
              href: "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
            },
          },
          id: "6e2d42ae-728a-4ef3-8911-921a19de99db",
          uniqueName: "WFT\\E152574",
          imageUrl:
            "https://ados/WirelineRnD_Collection/_apis/GraphProfile/MemberAvatars/win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
          descriptor:
            "win.Uy0xLTUtMjEtMTIxMzMyMzMyNC0zNzI0ODU4MzY1LTI3NTkwNzgzMzgtMjI3NjE0NA",
        },
        "System.CommentCount": 0,
        "System.Title": "[PreView to Cloud] Fix Unreliable Azure Deploy",
        "System.BoardColumn": "Committed",
        "System.BoardColumnDone": false,
        "Microsoft.VSTS.Common.BacklogPriority": 1935875686.0,
        "Microsoft.VSTS.Scheduling.Effort": 2.0,
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column": "Committed",
        "WEF_9C584B10580A420D99D7F8BA1CD09959_Kanban.Column.Done": false,
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column": "Committed",
        "WEF_890A350E635B432AA4F8A5870820C5D6_Kanban.Column.Done": false,
        "System.Description":
          '<div>The Octopus Azure deploy randomly fails more often than we would like.</div><div>It quite often fails on the \'Deploy database package - Web\' step. This step does some potentially questionable stuff installing the database package to a temporary file on the Octopus server and then running migrations. The easiest way to fix this would probably be to just restore the previous deploy database package step that works on the app server.</div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/bec550a5-9038-46f8-8b7d-5669adb022ae?fileName=image.png" alt=Image><br></div><div>There may also be other steps that sometimes fail during the deploy; check if this is the case and also look into them.</div><div><br></div><div>Additionally the website sometimes breaks with the following error email after a deploy. A successful redeploy often fixes the issue.</div><div><img src="https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/attachments/befa075d-e111-4015-824d-bd6d4f7175f6?fileName=image.png" alt=Image><br></div><div><br></div>',
        "Microsoft.VSTS.Common.AcceptanceCriteria":
          "<div><ul><li>Azure deployment doesn't randomly fail for no good reason.</li><li>Azure deployment doesn't break the website</li></ul></div>",
        "System.Tags": "EVP/P56351; Sprint 176",
      },
      relations: [
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/62664",
          attributes: { isLocked: false, name: "Parent" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79934",
          attributes: { isLocked: false, name: "Child" },
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79933",
          attributes: { isLocked: false, name: "Child" },
        },
      ],
      url: "https://ados/WirelineRnD_Collection/7c9ba370-9fa1-43a6-bef6-406ff6d43733/_apis/wit/workItems/79799",
    },
  ],
};
