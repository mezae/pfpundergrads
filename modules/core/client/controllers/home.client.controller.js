'use strict';

angular.module('core').controller('HomeController', ['$scope', '$filter', '$modal', 'Authentication',
    function($scope, $filter, $modal, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;

        $scope.theColors = ['#a095ff', '#95bfff', '#95ffd5', '#ff95bf'];

        function findTransfers(headers, rows) {
            var required_fields = ['Academic Year', 'StudentID', 'Name', 'College', 'Status'];
            var modal = $modal.open({
                templateUrl: 'modules/core/views/mapping.client.view.html',
                controller: 'ModalInstanceCtrl',
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    arrays: function() {
                        return {
                            type: 'Undergrads',
                            required_fields: required_fields,
                            headers: headers
                        };
                    }
                }
            });

            modal.result.then(function(csvheaders) {

                headers = {
                    year_col: headers.indexOf(csvheaders[0].label),
                    id_col: headers.indexOf(csvheaders[1].label),
                    name_col: headers.indexOf(csvheaders[2].label),
                    college_col: headers.indexOf(csvheaders[3].label),
                    status_col: headers.indexOf(csvheaders[4].label)
                };

                $scope.students = [];

                for (var i = 0; i < rows.length; i++) {
                    var record = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    if (record.length > 1) {
                        var newStudent = {
                            id: record[headers.id_col],
                            name: record[headers.name_col],
                            college: [{
                                year: record[headers.year_col].slice(-4),
                                name: record[headers.college_col],
                                status: record[headers.status_col]
                            }]
                        };
                        var index = _.findIndex($scope.students, 'id', newStudent.id);
                        if (index === -1) {
                            $scope.students.push(newStudent);
                        } else {
                            $scope.students[index].college.push(newStudent.college[0]);
                            $scope.students[index].college = _.sortBy($scope.students[index].college, 'year');
                        }
                    }
                }

                //filter out anyone who started and ended at the same school
                $scope.students = _.filter($scope.students, function(student) {
                    return student.college[0].name !== student.college[student.college.length - 1].name;
                })
                console.log($scope.students.length);
                $scope.removeDropzone = true;
                downloadCSV();
            });
        }

        $scope.handleFileSelect = function(files) {
            if (files.length === 0) {
                $scope.alert = {
                    active: true,
                    type: 'danger',
                    msg: 'Must be a csv file!'
                };
            } else {
                var file = files[0];
                var reader = new FileReader();
                reader.onload = function(file) {
                    var content = file.target.result;
                    var rows = content.split(/[\r\n|\n]+/);
                    var headers = rows.shift();
                    headers = headers.split(',');
                    findTransfers(headers, rows);
                };
                reader.readAsText(file);
                files[0] = undefined;
            }
        };

        function downloadCSV() {
            var headers = ['id', 'name', 'college'];
            var csvString = headers.join(',') + '\r\n';
            _.forEach($scope.students, function(student) {
                _.forEach(headers, function(key) {
                    var line = student[key];
                    if (key === 'college') {
                        line = '"' + JSON.stringify(student[key]) + '"';
                    }
                    csvString += line + ',';
                });
                csvString += '\r\n';
            });

            var date = $filter('date')(new Date(), 'MM-dd');
            $scope.fileName = ('UATransfers' + '_' + date + '.csv');
            var blob = new Blob([csvString], {
                type: 'text/csv;charset=UTF-8'
            });
            $scope.url = window.URL.createObjectURL(blob);
        }

    }
]);