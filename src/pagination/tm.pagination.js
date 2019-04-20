/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 0.12.1 - 2015-10-17
 * License: MIT
 * ReWrite Ver:1.0.1
 * Fixed:页数只能输入数字
 *
 * ReWrite Ver:1.0.2
 * Fixed:页数计算优化
 */
//angular.module("ui.bootstrap", ["ui.bootstrap.tpls","ui.bootstrap.pagination"]);
//angular.module("ui.bootstrap.tpls", ["template/pagination/pager.html","template/pagination/pagination.html"]);
angular.module('ui.bootstrap.pagination', ["template/pagination/pager.html","template/pagination/pagination.html"])

    .controller('PaginationController', ['$scope', '$attrs', '$parse', function ($scope, $attrs, $parse) {
      $scope.pageSizes =[2,10, 20, 50, 100, 300, 500];
      var self = this,
          ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
          setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;
      this.init = function(ngModelCtrl_, config) {
        ngModelCtrl = ngModelCtrl_;
        this.config = config;

        ngModelCtrl.$render = function() {
          self.render();
        };

        if ($attrs.itemsPerPage) {
          $scope.$parent.$watch($parse($attrs.itemsPerPage), function(n,o) {
            if(n) {
              self.itemsPerPage = parseInt(n, 10);
              $scope.itemPerPage = parseInt(n, 10);
              $scope.totalPages = self.calculateTotalPages();
            }
          });
        } else {
          this.itemsPerPage = config.itemsPerPage;
        }
      };

      this.calculateTotalPages = function() {
        var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
        return Math.max(totalPages || 0, 1);
      };

      this.render = function() {
        if(ngModelCtrl.$viewValue!='')
          $scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1;
      };

      $scope.selectPage = function(page) {
        console.log('page:',page)
        if (/^[0-9]+$/.test(page)) {
          if ($scope.page !== page && page > 0 && page <= $scope.totalPages) {
            ngModelCtrl.$setViewValue(page);
            ngModelCtrl.$render();
          }
          if(page==1){
              setTimeout(function () {
                  $("#paginationNum").focus();
                  $("#paginationNum").select();
              })
          }
        }else {
          $scope.selectPage($scope.currentPage='1');

        }
      };


      $scope.getText = function( key ) {
        return $scope[key + 'Text'] || self.config[key + 'Text'];
      };
      $scope.noPrevious = function() {
        return $scope.page === 1;
      };
      $scope.noNext = function() {
        return $scope.page === $scope.totalPages;
      };

      $scope.$watch('totalItems', function() {
        $scope.totalPages = self.calculateTotalPages();
      });
      $scope.$watch('totalPages', function(value) {
        setNumPages($scope.$parent, value); // Readonly variable

        if ( $scope.page > value ) {
          $scope.selectPage(value);
        } else {
          ngModelCtrl.$render();
        }
      });

      $scope.checkPage=function(min,max,c) {
        var current = c;
        if (typeof current != 'string' || current.length > 0){
            current = current < min ? min : current > max ? max : current;
        }

        return current;
      };

        // $scope.keyDown = function (page) {
        //     var oEvent = window.event;
        //     if (oEvent.keyCode == 8 && page == 1) {
        //         $("#paginationNum").focus();
        //         $("#paginationNum").select();
        //     }
        // };
        //


        window.keyDown = function () {
            var oEvent = window.event;
            if (oEvent.keyCode == 8 && $scope.currentPage == 1) {
                $("#paginationNum").focus();
                $("#paginationNum").select();
            }
        }

    }])

    .constant('paginationConfig', {
      itemsPerPage: 10,
      boundaryLinks: false,
      directionLinks: true,
      firstText: 'First',
      previousText: 'Previous',
      nextText: 'Next',
      lastText: 'Last',
      rotate: true
    })

    .directive('pagination', ['$parse', 'paginationConfig', function($parse, paginationConfig) {
      return {
        restrict: 'EA',
        scope: {
          totalItems: '=',
          itemsPerPage:'=',
          pageSizes:'=',
          editPage:'=',
          firstText: '@',
          previousText: '@',
          nextText: '@',
          lastText: '@',
          currentPage:'=ngModel'
        },
        require: ['pagination', '?ngModel'],
        controller: 'PaginationController',
        templateUrl: 'template/pagination/pagination.html',
        replace: true,
        link: function(scope, element, attrs, ctrls) {

          var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

          if (!ngModelCtrl) {
            return; // do nothing if no ng-model
          }
          scope.$watch('itemsPerPage',function(n,o){
            if(n&&n!=o) {
              ngModelCtrl.$setViewValue(0);
              ngModelCtrl.$setViewValue(1);
              ngModelCtrl.$render();
            }
          })

          // Setup configuration parameters
          var maxSize = angular.isDefined(attrs.maxSize) ? scope.$parent.$eval(attrs.maxSize) : paginationConfig.maxSize,
              rotate = angular.isDefined(attrs.rotate) ? scope.$parent.$eval(attrs.rotate) : paginationConfig.rotate;
          scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : paginationConfig.boundaryLinks;
          scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : paginationConfig.directionLinks;

          paginationCtrl.init(ngModelCtrl, paginationConfig);
          if (attrs.maxSize) {
            scope.$parent.$watch($parse(attrs.maxSize), function(value) {
              maxSize = parseInt(value, 10);
              paginationCtrl.render();
            });
          }
          // Create page object used in template
          function makePage(number, text, isActive) {
            return {
              number: number,
              text: text,
              active: isActive
            };
          }

          function getPages(currentPage, totalPages) {
            var pages = [];

            // Default page limits
            var startPage = 1, endPage = totalPages;
            var isMaxSized = ( angular.isDefined(maxSize) && maxSize < totalPages );

            // recompute if maxSize
            if ( isMaxSized ) {
              if ( rotate ) {
                // Current page is displayed in the middle of the visible ones
                startPage = Math.max(currentPage - Math.floor(maxSize/2), 1);
                endPage   = startPage + maxSize - 1;

                // Adjust if limit is exceeded
                if (endPage > totalPages) {
                  endPage   = totalPages;
                  startPage = endPage - maxSize + 1;
                }
              } else {
                // Visible pages are paginated with maxSize
                startPage = ((Math.ceil(currentPage / maxSize) - 1) * maxSize) + 1;

                // Adjust last page if limit is exceeded
                endPage = Math.min(startPage + maxSize - 1, totalPages);
              }
            }
            // Add page number links
            for (var number = startPage; number <= endPage; number++) {
              //ignore those unused numbers
              if(number == startPage||number == endPage || number < currentPage+10&&number > currentPage-10) {
                var page = makePage(number, number, number === currentPage);
                pages.push(page);
              }
            }

            // Add links to move between page sets
            if ( isMaxSized && ! rotate ) {
              if ( startPage > 1 ) {
                var previousPageSet = makePage(startPage - 1, '...', false);
                pages.unshift(previousPageSet);
              }

              if ( endPage < totalPages ) {
                var nextPageSet = makePage(endPage + 1, '...', false);
                pages.push(nextPageSet);
              }
            }
            return pages;
          }

          var originalRender = paginationCtrl.render;
          paginationCtrl.render = function() {
            originalRender();
            if (scope.page > 0 && scope.page <= scope.totalPages) {
              scope.pages = getPages(scope.page, scope.totalPages);
            }
          };
        }
      };
    }])

    .constant('pagerConfig', {
      itemsPerPage: 10,
      previousText: '« Previous',
      nextText: 'Next »',
      align: true
    })

    .directive('pager', ['pagerConfig', function(pagerConfig) {
      return {
        restrict: 'EA',
        scope: {
          totalItems: '=',
          previousText: '@',
          nextText: '@'
        },
        require: ['pager', '?ngModel'],
        controller: 'PaginationController',
        templateUrl: 'template/pagination/pager.html',
        replace: true,
        link: function(scope, element, attrs, ctrls) {
          var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

          if (!ngModelCtrl) {
            return; // do nothing if no ng-model
          }

          scope.align = angular.isDefined(attrs.align) ? scope.$parent.$eval(attrs.align) : pagerConfig.align;
          paginationCtrl.init(ngModelCtrl, pagerConfig);
        }
      };
    }]);

angular.module("template/pagination/pager.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/pagination/pager.html",
      "<ul class=\"pager\">\n" +
      "  <li ng-class=\"{disabled: noPrevious(), previous: align}\"><a href ng-click=\"selectPage(page - 1)\">{{getText('previous')}}</a></li>\n" +
      "  <li ng-class=\"{disabled: noNext(), next: align}\"><a href ng-click=\"selectPage(page + 1)\">{{getText('next')}}</a></li>\n" +
      "</ul>");
}]);

// angular.module("template/pagination/pagination.html", []).run(["$templateCache", function($templateCache) {
//   $templateCache.put("template/pagination/pagination.html",
//       "<div>\n"+
//       "<div class=\"edit\"><span class=\"total-page\" ng-show=\"editPage\">&nbsp;共{{totalPages}}页&nbsp;&nbsp;共{{totalItems}}条&nbsp;&nbsp;</span><span class=\"page-edit\" ng-show=\"editPage\">第&nbsp;"+
//       "<input type=\"text\" ng-model=\"currentPage\" ng-change=\"selectPage(currentPage=checkPage(1,totalPages,currentPage))\""+
//       "requied class=\"table-counts-text\"/>&nbsp;页</span><span class=\"page-size-edit\" ng-show=\"pageSizes\">&nbsp;&nbsp;每页&nbsp;\n"+
//       "<select ng-model=\"itemsPerPage\" class=\"table-counts-select\"\n"+
//       "ng-options=\"count as count  for count in pageSizes\">\n"+
//       "</select>&nbsp;条</span>\n"+
//       "</div>\n"+
//       "<ul class=\"pagination\">\n" +
//       "  <li ng-if=\"boundaryLinks\" ng-class=\"{disabled: noPrevious()}\"><a href ng-click=\"selectPage(1)\">{{getText('first')}}</a></li>\n" +
//       "  <li ng-if=\"directionLinks\" ng-class=\"{disabled: noPrevious()}\"><a href ng-click=\"selectPage(page - 1)\">{{getText('previous')}}</a></li>\n" +
//       "  <li ng-if=\"page.number==1||page.number==totalPages||(page.number-currentPage)*(page.number-currentPage)<=16\" "+
//       "ng-repeat=\"page in pages track by $index\" ng-class=\"{active: page.active}\">"+
//       "<a ng-if=\"page.number==1||page.number==totalPages||(page.number-currentPage)*(page.number-currentPage)<16\" href ng-click=\"selectPage(page.number)\">{{page.text}}</a>"+
//       "<span ng-if=\"page.number!=1&&page.number!=totalPages&&(page.number-currentPage)*(page.number-currentPage)==16\">....</span></li>\n" +
//       "  <li ng-if=\"directionLinks\" ng-class=\"{disabled: noNext()}\"><a href ng-click=\"selectPage(page + 1)\">{{getText('next')}}</a></li>\n" +
//       "  <li ng-if=\"boundaryLinks\" ng-class=\"{disabled: noNext()}\"><a href ng-click=\"selectPage(totalPages)\">{{getText('last')}}</a></li>\n" +
//       "</ul></div>");
// }]);

angular.module("template/pagination/pagination.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/pagination/pagination.html",
      "<div class='am-u-md-12' style='margin-top:10px;'>"+
      "     <div class='am-u-md-4 hidden-xs '>" +
    
      "     </div>" +
      "     <div class='am-u-md-8 text-right text-center-xs'>" +
        "       <span>每页显示</span><span><select class='form-control input-sm' style='width: 100px;display: inline-block'  ng-model='itemsPerPage'  ng-options='count as count  for count in pageSizes'></select></span>" +
      "         <span>条</span>" +
      "         <span class='text-muted inline m-t-sm m-b-sm' ng-show='editPage'>总共{{totalItems}}条记录</span>" +
      "         <span class='text-muted inline m-t-sm m-b-sm' ng-show='editPage'>/共{{totalPages}}页</span><br/>" +
      "         <ul class='pagination m-t-none m-b-none'>" +
      "             <li  ng-if='boundaryLinks' ng-class='{disabled: noPrevious()}'>" +
      "                 <a href ng-click='selectPage(1)'><i class='fa fa-chevron-left'></i>{{getText('first')}}</a>" +
      "             </li>" +
      "             <li ng-if='directionLinks' ng-class='{disabled: noPrevious()}'><a href ng-click='selectPage(page - 1)'>{{getText('previous')}}</a></li>" +
      "             <li ng-if='page.number==1||page.number==totalPages||(page.number-currentPage)*(page.number-currentPage)<=16' ng-repeat='page in pages track by $index' ng-class='{active: page.active}'>" +
      "                 <a href  ng-if='page.number==1||page.number==totalPages||(page.number-currentPage)*(page.number-currentPage)<16' ng-click='selectPage(page.number)'>{{page.text}}</a><span ng-if='page.number!=1&&page.number!=totalPages&&(page.number-currentPage)*(page.number-currentPage)==16'>....</span>" +
      "             </li><li ng-if='directionLinks' ng-class='{disabled: noNext()}'><a href ng-click='selectPage(page + 1)'>{{getText('next')}}</a></li>" +
      "             <li ng-if='boundaryLinks' ng-class='{disabled: noNext()}'><a href ng-click='selectPage(totalPages)'><i class='fa fa-chevron-right'></i>{{getText('last')}}</a></li>" +
      "         </ul>" +
      "     </div>" +
      "</div>");
}]);