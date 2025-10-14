import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/authenticate/login/login.component';
import { LayoutComponent } from './layout';
import { AccessDeniedComponent } from './modules/authenticate/access-denied';

import { AuthGuard } from './modules/authenticate/auth-guard';
import { AppSelectorComponent } from './modules/app-selector/app-selector.component';
// import { TyrComponent } from './modules/tyr/tyr.component';

// import { WellSelectorComponent } from './modules/common/well-selector/well-selector.component';
// //import { OdinV2TimelineViewComponent } from './modules/odinv2/timelineview/odin-timelineview.component';
// import { TyrDashboardComponent } from './modules/tyr/tyr-landing-page/tyr-dashboard/tyr-dashboard.component';
// import { TyrLandingPageComponent } from './modules/tyr/tyr-landing-page/tyr-landing-page.component';
// import { TyrDetailComponent } from './modules/tyr/tyr-landing-page/tyr-detail/tyr-detail.component';
//import { OdinRigScheduleAnalysisComponent } from './modules/odinv2/rig-schedule-analysis/odin-rig-schedule-analysis/odin-rig-schedule-analysis.component';
//import { OdinTimelineViewAnalysisComponent } from './modules/odinv2/timelineview/odin-timeline-view-analysis/odin-timeline-view-analysis.component';
// import { TyrMetricsComponent } from './modules/tyr/tyr-metrics/tyr-metrics.component';
//import { RawdatamasterComponent } from './modules/odinv2/rawdatamaster/rawdatamaster.component';
import { SchematicComponent } from './modules/schematic';
import { SchematicDetailComponent } from './modules/schematic/schematic-detail/schematic-detail.component';
import { SchematicLandingComponent } from './modules/schematic/schematic-landing/schematic-landing.component';
import { Thorv2Component } from './modules/thorv2/thorv2.component';
import { ThorModuleToolBarComponent } from './modules/thorv2/thor-module-toolbar/thor-module-toolbar.component';
import { DrillingInteractiveComponent } from './modules/thorv2/drilling-interactive/drilling-interactive.component';
import { CompletionsInteractiveComponent } from './modules/thorv2/completions/completions-interactive.component';
// import { OdinComponent } from './modules/odinv3/odinv3.component';
import { Odin3CompletionDashboardComponent, OdinV3Component, OdinV3DrillingDashboardComponent } from './modules/odinv3';
import { OdinDashboardComponent } from './modules/odinv3/odin-dashboard/odin-dashboard.component';
import { OdinRawDataComponent } from './modules/odinv3/odin-raw-data/odin-raw-data.component';
import { OdinAssembly3Component } from './modules/odinv3/odin-assembly/odin-assembly.component';
import { OdinRigScheduleComponent } from './modules/odinv3/odin-rig-schedule/odin-rig-schedule.component';
import { OdinRigScheduleDrillingComponent } from './modules/odinv3/odin-rig-schedule/odin-rig-schedule-drilling/odin-rig-schedule-drilling.component';
import { OdinRigScheduleCompletionsComponent } from './modules/odinv3/odin-rig-schedule/odin-rig-schedule-completions/odin-rig-schedule-completions.component';
import { OdinDemandConsumptionValuationComponent3 } from './modules/odinv3/odin-demand-consumption-valuation/odin-demand-consumption-valuation.component';
import { MdlDashboardComponent } from './modules/mdl/mdl-dashboard/mdl-dashboard.component';
import { WellheadComponent } from './modules/odinv3/wellhead/wellhead.component';
import { OdinCompletionRawDataComponent } from './modules/odinv3/odin-completion-raw-data/odin-completion-raw-data.component';
import { AdminComponent } from './modules/admin/admin.component';
import { AdminModuleComponent } from './modules/admin/admin-module/admin-module.component';
import { AdminListEditorComponent } from './modules/admin/admin-list-editor/admin-list-editor.component';
import { Tyr2Component } from './modules/tyr2/tyr2.component';
import { Tyr2ToolbarComponent } from './modules/tyr2/tyr2-toolbar/tyr2-toolbar.component';
import { Tyr2DrillingComponent } from './modules/tyr2/tyr2-drilling/tyr2-drilling.component';
import { InvoiceManagementComponent } from './modules/tyr2/invoice-management/invoice-management.component';
import { TyrListEditorComponent } from './modules/tyr2/tyr-list-editor/tyr-list-editor.component';
import { InboxManagementComponent } from './modules/tyr2/inbox-management/inbox-management.component';
//import { OdinV2TimelineViewAnalysisComponent } from './modules/odinv2/timelineview/odin-timeline-view-analysis/odin-timeline-view-analysis.component';
//import { OdinDrillingTimelineViewAnalysisComponent } from './modules/odinv2/odin-drilling-timelineview/odin-drilling-timeline-view-analysis/odin-drilling-timeline-view-analysis.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
        data: { breadcrumb: 'Access Denied' },
      },

      //odin3
      {
        path: 'odin',
        component: OdinV3Component,
        data: { breadcrumb: '', screen: 'odin' ,appName: 'ODIN' },
        canActivate: [AuthGuard],
        children: [
          {
            path: 'dashboard',
            component: OdinDashboardComponent,
            data: { breadcrumb: 'Dashboard' },

            children: [
              {
                path: '',
                redirectTo: 'dashboarddrilling',
                pathMatch: 'full'
              },
              {
                path: 'dashboarddrilling',
                component: OdinV3DrillingDashboardComponent,
                data: { breadcrumb: '' }
              },
              {
                path: 'dashboardcompletion',
                component: Odin3CompletionDashboardComponent,
                data: { breadcrumb: '' }
              },
            ]
          },
          {
            path: 'riganalysis',
            component: OdinRigScheduleComponent,
            data: { breadcrumb: 'Rig Schedule Analysis' },

            children: [
              {
                path: '',
                redirectTo: 'riganalysisdrilling',
                pathMatch: 'full'
              },
              {
                path: 'riganalysisdrilling',
                component: OdinRigScheduleDrillingComponent,
                data: { breadcrumb: '' }
              },
              {
                path: 'riganalysiscompletion',
                component: OdinRigScheduleCompletionsComponent,
                data: { breadcrumb: '' }
              },
            ]
          },
          // New route for rawdata and asswmbly
          {
            path: 'rawdata',
            component: OdinRawDataComponent,
            data: { breadcrumb: 'Raw Data' },
          },
          // route for completion raw data
          {
            path: 'completionrawdata',
            component: OdinCompletionRawDataComponent,
            data: { breadcrumb: 'Completion Raw Data' },
          },
          // new route for wellhead
          {
            path: 'wellhead',
            component: WellheadComponent,
            data: { breadcrumb: 'Well Head' },
          },
          {
            path: 'assembly',
            component: OdinAssembly3Component,
            data: { breadcrumb: 'Completion Assembly' }
          },
          {
            path: 'demandconsumptionvaluation',
            component: OdinDemandConsumptionValuationComponent3,
            data: { breadcrumb: 'Demand Consumption Valuation' }
          },
        ],
      },
      {
        path: 'thor',
        component: Thorv2Component,
        data: { breadcrumb: '' ,appName: 'THOR'},
        canActivate: [AuthGuard],

        children: [
          {
            path: '',
            component: ThorModuleToolBarComponent,
            data: { breadcrumb: '' },
            children: [
              {
                path: '',
                redirectTo: 'thordashboard',
                pathMatch: 'full'
              },
              {
                path: 'thordashboard',
                component: DrillingInteractiveComponent,
                data: { breadcrumb: 'Drilling' }
              },
              {
                path: 'thordashboard/completions',
                component: CompletionsInteractiveComponent,
                data: { breadcrumb: 'Completions' }
              }
            ]
          },
        ],
      },

      // Old TRY MOdule
      // {
      //   path: 'tyr1',
      //   component: TyrComponent,
      //   canActivate: [AuthGuard],
      //   //   data: { breadcrumb: 'Tyr',
      //   //     tabMenu: [{
      //   //     label: 'Work Queue',
      //   //     routerLink: 'tyr/workqueue'
      //   //   }, {
      //   //     label: 'Metrics',
      //   //     routerLink: 'tyr/metrics'
      //   //   }]
      //   // },

      //   children: [
      //     {
      //       path: '',
      //       redirectTo: 'metrics', pathMatch: 'full'
      //     },
      //     {
      //       path: 'metrics',
      //       component: TyrMetricsComponent,
      //       data: { breadcrumb: 'Metrics' },
      //     },
      //     {
      //       path: 'landing',
      //       component: TyrLandingPageComponent,
      //       data: { breadcrumb: 'Landing' },
      //     },
      //     {
      //       path: 'workqueue',
      //       data: { breadcrumb: 'Work Queue' },
      //       children: [
      //         {
      //           path: '',
      //           component: TyrDashboardComponent,
      //           data: { breadcrumb: '' },
      //         },
      //         {
      //           path: 'detail',
      //           component: TyrDetailComponent,
      //           data: { breadcrumb: 'Details' }
      //         },
      //       ]
      //     }
      //   ],
      // },



      // Tyr2Module     
      // {
      //   path: 'tyr',
      //   component: Tyr2Component,
      //   canActivate: [AuthGuard],
      //   data: {
      //     breadcrumb: 'Select',
      //     appName: 'TYR'
      //   },
      //   children: [
      //     {
      //       path: '',
      //       component: Tyr2ToolbarComponent,
      //       data: { breadcrumb: '' },
      //       children: [
      //         {
      //           path: '',
      //           redirectTo: 'tyr2Dashboard',
      //           pathMatch: 'full'
      //         },
      //         {
      //           path: 'tyr2Dashboard',
      //           component: Tyr2DrillingComponent,
      //           data: { breadcrumb: '' }
      //         },
      //         {
      //         path: 'invoice',
      //           component: InvoiceManagementComponent,
      //           data: { breadcrumb: 'Invoice Management' },
      //         },
      //         {
      //           path: 'tyr-list-editor',
      //           component: TyrListEditorComponent,
      //           data: { breadcrumb: 'List Editor' },
      //         },
      //       ]
      //     },
      //   ],
      // },
      {
        path: 'tyr',
        component: Tyr2Component,
        canActivate: [AuthGuard],
        data: {
          breadcrumb: '',
          appName: 'TYR'
        },
        children: [
          {
            path: '',
            component: Tyr2ToolbarComponent,
            data: { breadcrumb: '' },
            children: [
              {
                path: '',
                redirectTo: 'tyr2Dashboard',
                pathMatch: 'full'
              },
              {
                path: 'tyr2Dashboard',
                component: Tyr2DrillingComponent,
                data: { breadcrumb: 'Task Management' }
              },
              {
              path: 'invoice',
                component: InvoiceManagementComponent,
                data: { breadcrumb: 'Invoice Management' },
              },
              {
              path: 'inbox',
                component: InboxManagementComponent,
                data: { breadcrumb: 'Inbox' },
              },
              {
                path: 'tyr-list-editor',
                component: TyrListEditorComponent,
                data: { breadcrumb: 'List Editor' },
              },
            ]
          },
        ],
      },
      {
        path: 'mdl',
        component: MdlDashboardComponent,
        canActivate: [AuthGuard],
        data: {
          breadcrumb: 'Master Data Library',
          appName: 'MDL'
          //tabMenu: [{
          //  label: 'Work Queue',
          //  routerLink: 'mdl/workqueue'
          //}, {
          //  label: 'Metrics',
          //  routerLink: 'mdl/metrics'
          //}]
        },

        //children: [
        //  {
        //    path: '',
        //    component: MdlComponent,
        //  },
        //{
        //  path: 'metrics',
        //  component: MDLMetricsComponent,
        //  data: { breadcrumb: 'Metrics' },
        //},
        //{
        //  path: 'landing',
        //  component: MdlLandingPageComponent,
        //  data: { breadcrumb: 'Landing' },
        //},
        //{
        //  path: 'workqueue',
        //  data: { breadcrumb: 'Work Queue' },
        //  children: [
        //    {
        //      path: '',
        //      component: MdlDashboardComponent,
        //      data: { breadcrumb: '' },
        //    },
        //    //{
        //    //  path: 'detail',
        //    //  component: MdlDetailComponent,
        //    //  data: { breadcrumb: 'Details' }
        //    //},
        //  ]
        //}
        //],
      },
      {
        path: 'schematic',
        component: SchematicComponent,
        canActivate: [AuthGuard],
        data: {
          breadcrumb: 'Select',
          appName: 'SCHEMATIC'
        },
        children: [
          {
            path: '',
            component: SchematicLandingComponent,
            canActivate: [AuthGuard],
            data: { breadcrumb: '' },
          },
          {
            path: 'schematiclanding',
            component: SchematicLandingComponent,
            canActivate: [AuthGuard],
            data: { breadcrumb: '' },
          },
          {
            path: 'schematicdetail/:id',
            component: SchematicDetailComponent,
            data: { breadcrumb: 'Detail' },
          }
        ]
      },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuard],
        data: {
          breadcrumb: '',
          appName: 'ADMIN'
        },
        children: [
          {
            path: '',
            component: AdminModuleComponent,
            canActivate: [AuthGuard],
            data: { breadcrumb: '' },
          },
          {
            path: 'admin-module',
            component: AdminModuleComponent,
            canActivate: [AuthGuard],
            data: { breadcrumb: '' },
          },
          {
            path: 'admin-list-editor',
            component: AdminListEditorComponent,
            canActivate: [AuthGuard],
            data: { breadcrumb: '' },
          },
        ]
      },
      {
        path: 'app-selector',
        component: AppSelectorComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: '' },
      },
      { path: '**', redirectTo: '/login', pathMatch: 'full' },
    ],
  },
];

