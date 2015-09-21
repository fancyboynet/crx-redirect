(function($){
    'use strict';
    var parse = function(url, data){
        var result = true;
        data.every(function(el, index, array){
            if(!el.enable){
                return true;
            }
            el.map.every(function(el, index, array){
                if(!el.enable){
                    return true;
                }
                var reg = new RegExp(el.request, 'ig');
                if(reg.test(url)){
                    result = {
                        redirectUrl : el.response
                    };
                    return false;
                }
                return true;
            });
        });
        return result;
    };
    var helper = {
        alertError : function(text){
            $('#alert-danger').text(text).show().delay(2000).fadeOut();
        },
        alertSuccess : function(text){
            $('#alert-success').text(text).show().delay(2000).fadeOut();
        },
        storage : {
            set : function(data, callback){
                chrome.storage.local.set({"redirect": data}, function() {
                    callback && callback();
                    chrome.runtime.sendMessage(data, function(response) {
                        //console.log(response);
                    });
                });
            },
            get : function(callback){
                chrome.storage.local.get("redirect",  function (obj) {
                    callback && callback(obj);
                });
            }
        }
    };

    var defaultData = [
        {
            "name" : "category_1",
            "enable" : true,
            "map" : [
                {
                    "request" : "*.test.com\/",
                    "response" : "http://localhost:8888/test",
                    "enable" : false
                }
            ]
        }
    ];
    var category = {
        init : function(){
            var self = this;
            self._$categoryList = $('#categoryList');
            self._tpl = $('#tplCategory').html();
            self._render();
            self._renderAdd();
            return self;
        },
        get : function(name){
            var category = null;
            if(name === undefined){
                category = defaultData[0];
            }
            else{
                $.each(defaultData, function(i, v){
                    if(v.name === name){
                        category = v;
                        return false;
                    }
                });
            }
            return category;
        },
        getIndex : function(name){
            var index = -1;
            $.each(defaultData, function(i, v){
                if(v.name === name){
                    index = i;
                    return false;
                }
            });
            return index;
        },
        _add : function(name){
            var self = this;
            if(!name.length){
                helper.alertError('分类名称不能为空!');
                return false;
            }
            if(self.get(name)){
                helper.alertError('分类名称不能重复!');
                return false;
            }
            defaultData.push({
                name : name,
                enable : true,
                map : []
            });
            return true;
        },
        _enable : function(name, enable){
            var self = this;
            var category = self.get(name);
            category.enable = !!enable;
        },
        _rename : function(oldName, newName){
            var self = this;
            if(!newName.length){
                helper.alertError('分类名称不能为空!');
                return false;
            }
            if(newName !== oldName && self.get(newName)){
                helper.alertError('分类名称不能重复!');
                return false;
            }
            var category = self.get(oldName);
            category.name = newName;
            return true;
        },
        _toSaveEdit : function($one){
            var self = this;
            var oldName = $one.attr('data-name');
            var newName = $one.find('.inputName').val();

            if(self._rename(oldName, newName)){
                $one.removeClass('edit').attr('data-name', newName);
                $one.find('.inputName').attr('disabled', '');
                $one.find('.btn-edit').text('Edit');
                rule.setCategory(newName);
            }
        },
        _del : function(name){
            var self = this;
            if(defaultData.length <= 1){
                helper.alertError('至少需要一个分类!');
                return false;
            }
            var category = self.get(name);
            if(!category){
                return false;
            }
            defaultData.splice(self.getIndex(name), 1);
            return true;
        },
        _toEdit : function($one){
            var self = this;
            var name = $one.attr('data-name');
            if($one.hasClass('edit')){
                self._toSaveEdit($one);
                return;
            }
            $one.addClass('edit');
            $one.find('.inputName').removeAttr('disabled').focus();
            $one.find('.btn-edit').text('Save');
        },
        _toDisable : function($one){
            var self = this;
            var name = $one.attr('data-name');
            if($one.hasClass('disabled')){
                $one.removeClass('disabled').find('.btn-disable').text('Disable');
                self._enable(name, true);
                return;
            }
            $one.addClass('disabled').find('.btn-disable').text('Enable');
            self._enable(name, false);
        },
        _toDel : function($one){
            var self = this;
            var name = $one.attr('data-name');
            if(self._del(name)){
                $one.remove();
                rule.remove(name);
            }
        },
        _toShow : function($one){
            var self = this;
            var name = $one.attr('data-name');
            $one.addClass('current').siblings().removeClass('current');
            rule.update(name);
        },
        _render : function(){
            var self = this;
            self._$categoryList
                .on('click', '.list-group-item', function(){
                    self._toShow($(this));
                })
                .on('click', '.btn-edit', function(){
                    self._toEdit($(this).closest('.list-group-item'));
                })
                .on('click', '.btn-disable', function(){
                    self._toDisable($(this).closest('.list-group-item'));
                })
                .on('click', '.btn-del', function(){
                    self._toDel($(this).closest('.list-group-item'));
                });
        },
        _renderAdd : function(){
            var self = this;
            $('#btnAddCategory').on('click', function(){
                var name = $('#inputAddCategory').val();
                if(self._add(name)){
                    $('#inputAddCategory').val('');
                    self.update(name);
                }
            });
        },
        _createOne : function(data){
            var self = this;
            var $one = $(self._tpl);
            $one.attr('data-name', data.name).find('.inputName').val(data.name);
            if(!data.enable){
                $one.addClass('disabled').find('.btn-disable').text('Enable');
            }
            return $one;
        },
        update : function(name){
            var self = this;
            self._$categoryList.empty();
            $.each(defaultData, function(i, v){
                self._$categoryList.append(self._createOne(v));
            });
            name = name || self.get().name;
            rule.update(name);
            self._$categoryList.find('li[data-name=' + name + ']').addClass('current')
        }
    };
    var rule = {
        init : function(){
            var self = this;
            self._$categoryName = $('#categoryName');
            self._$ruleList = $('#ruleList');
            self._tpl = $('#tplCategory').html();
            self._render();
            self._renderAdd();
            self._renderSave();
            return self;
        },
        _renderAdd : function(){
            var self = this;
            var $inputAddRequest = $('#inputAddRequest');
            var $inputAddResponse = $('#inputAddResponse');
            $('#btnAddRule').on('click', function(){
                var request = $inputAddRequest.val();
                var response = $inputAddResponse.val();
                if(self._add(self.getCategory(), request, response, true)){
                    $inputAddRequest.val('');
                    $inputAddResponse.val('');
                    self.update(self.getCategory());
                }
            });
        },
        _renderSave : function(){
            var self = this;
            $('#btnSaveAll').on('click', function(){
                helper.storage.set(defaultData, function(){
                    helper.alertSuccess('保存成功！');
                });
            });
        },
        _render : function(){
            var self = this;
            self._$ruleList
                .on('click', '.btn-edit', function(){
                    self._toEdit($(this).closest('li'));
                })
                .on('click', '.btn-disable', function(){
                    self._toDisable($(this).closest('li'));
                })
                .on('click', '.btn-del', function(){
                    self._toDel($(this).closest('li'));
                })
        },
        _toEdit : function($one){
            var self = this;
            if($one.hasClass('edit')){
                self._toSaveEdit($one);
                return;
            }
            $one.addClass('edit');
            $one.find('.inputRequest').removeAttr('disabled').focus();
            $one.find('.inputResponse').removeAttr('disabled');
            $one.find('.btn-edit').text('Save');
        },
        _toSaveEdit : function($one){
            var self = this;
            var request = $one.attr('data-request');
            if(self._edit(self.getCategory(), request, $one.find('.inputRequest').val(), $one.find('.inputResponse').val())){
                $one.removeClass('edit');
                $one.find('.inputRequest').attr('disabled', '');
                $one.find('.inputResponse').attr('disabled', '');
                $one.find('.btn-edit').text('Edit');
            }
        },
        _toDisable : function($one){
            var self = this;
            var request = $one.attr('data-request');
            if($one.hasClass('disabled')){
                $one.removeClass('disabled').find('.btn-disable').text('Disable').addClass('btn-primary');
                self._edit(self.getCategory(), request, '', '', true);
                return;
            }
            $one.addClass('disabled').find('.btn-disable').text('Enable').removeClass('btn-primary');
            self._edit(self.getCategory(), request, '', '', false);
        },
        _toDel : function($one){
            var self = this;
            var request = $one.attr('data-request');
            $one.remove();
            self._del(self.getCategory(), request);
        },
        get : function(name, request){
            var rule = null;
            var c = category.get(name);
            if(!c){
                return rule;
            }
            $.each(c.map, function(i, v){
                if(v.request === request){
                    rule = v;
                    return false;
                }
            });
            return rule;
        },
        getIndex : function(name, request){
            var index = -1;
            var c = category.get(name);
            if(!c){
                return index;
            }
            $.each(c.map, function(i, v){
                if(v.request === request){
                    index = i;
                    return false;
                }
            });
            return index;
        },
        _add : function(name, request, response, enable){
            var self = this;
            if(!request.length){
                helper.alertError('正则不能为空!');
                return false;
            }
            if(self.get(name, request)){
                helper.alertError('正则不能重复!');
                return false;
            }
            var c = category.get(name);
            c.map.push({
                "request" : request,
                "response" : response,
                "enable" : !!enable
            });
            return true;
        },
        _edit : function(name, oldRequest, request, response, enable){
            var self = this;
            if(request && oldRequest !== request && self.get(name, request)){
                helper.alertError('正则不能重复!');
                return false;
            }
            var rule = self.get(name, oldRequest);
            if(request){
                rule.request = request;
            }
            if(response){
                rule.response = response;
            }
            if(enable !== undefined){
                rule.enable = !!enable;
            }
            return true;
        },
        _del : function(name, request){
            var self = this;
            var rule = self.get(name, request);
            if(!rule){
                return;
            }
            category.get(name).map.splice(self.getIndex(name, request), 1);
        },
        _createOne : function(data){
            var self = this;
            var $one = $($('#tplRule').html());
            $one.attr('data-request', data.request).find('.inputRequest').val(data.request);
            $one.find('.inputResponse').val(data.response);
            if(!data.enable){
                $one.addClass('disabled').find('.btn-disable').text('Enable');
            }
            else{
                $one.removeClass('disabled').find('.btn-disable').text('Disable').addClass('btn-primary');
            }
            return $one;
        },
        remove : function(name){
            var self = this;
            if(name !== self.getCategory()){
                return;
            }
            self.update();
        },
        update : function(name){
            var self = this;
            var c = category.get(name);
            self._c = name;
            self.setCategory(c.name);
            self._$ruleList.empty();
            $.each(c.map, function(i, v){
                self._$ruleList.append(self._createOne(v));
            });
        },
        getCategory : function(){
            return this._c;
        },
        setCategory : function(name){
            var self = this;
            self._$categoryName.text(name);
        }
    };
    var navHandler = {
        init : function(){
            var self = this;
            $('#btnExport').on('click', function(){
                self._toExport();
            });
            $('#fileInput').on('change', function(e){
                self._toImport(e);
            });
            $('#btnExportAll').on('click', function(){
                self._toExport(true);
            });
            $('#fileInputAll').on('change', function(e){
                self._toImport(e, true);
            });
        },
        _toExport : function(isAll){
            function saveAs(blob, filename) {
                var type = blob.type;
                var force_saveable_type = 'application/octet-stream';
                if (type && type != force_saveable_type) { // 强制下载，而非在浏览器中打开
                    var slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, force_saveable_type);
                }

                var url = URL.createObjectURL(blob);
                var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
                save_link.href = url;
                save_link.download = filename;

                var event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                save_link.dispatchEvent(event);
                URL.revokeObjectURL(url);
            }

            var URL = URL || webkitURL || window;
            var saveData;
            var fileName;
            if(isAll){
                saveData = defaultData;
                fileName = 'redirect.json';
            }
            else{
                fileName = rule.getCategory() + '.json';
                saveData = [category.get(rule.getCategory())];
            }
            var bb = new Blob([JSON.stringify(saveData, null, '\t')], {type: 'text/json'});
            saveAs(bb, fileName);
        },
        _toImport : function(e, isAll){
            var reader = new FileReader();
            reader.onload = function(e) {
                try{
                    if(isAll){
                        defaultData = JSON.parse(reader.result);
                    }
                    else{
                        defaultData = defaultData.concat(JSON.parse(reader.result));
                    }
                    category.update();
                }catch(e){

                }
            };
            reader.readAsText(e.target.files[0], 'utf-8');
        }
    };
    var page = {
        init : function(){
            var self = this;
            category.init();
            rule.init();
            category.update();
            navHandler.init();
            return self;
        }
    };
    helper.storage.get(function(cacheData){
        cacheData = cacheData.redirect;
        if(cacheData){
            defaultData = cacheData;
        }
        page.init();
    });
})(jQuery);