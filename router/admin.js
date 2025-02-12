var express=require('express');
var router=express.Router();

var User=require('../models/User');
var Category=require('../models/Category');
var Content=require('../models/Content');
var userInfo;
router.use(function(req,res,next){
    if(!req.userInfo.isAdmin){
        //如果当前用户是非管理员
        res.render('admin/not_admin')
    }
    User.findOne({
        _id:req.userInfo._id
    }).then(function(us){
        userInfo=us;
        next();
    });
    
});
// 首页
router.get('/',function(req,res,next){
    res.render('admin/index',{
        userInfo:userInfo
    })
});
// 用户管理
router.get('/user',function(req,res,next){
    /**
     * 从数据库中读取所有的用户数据
     * 
     * linit(Number)：限制获取的数据条数
     * 
     * skip(2)：忽略数据的条数（跳过前面几个条数）
     * 每页显示2条
     * 1:   1-2     skip:0
     * 2:   3-4     skip:2
     * 
     */
    var page=Number(req.query.page||1);
    var limit=2;
    var pages=0;

    User.count().then(function(count){
        // 计算总页数
        pages=Math.ceil(count/limit );
        //取最大页数不能大于pages
        page=Math.min(page,pages);
        //取最小页数不能小于1
        page=Math.max(page,1);

        var skip=(page-1)*limit;

        User.find().limit(limit).skip(skip).then(function(users){
            res.render('admin/user_index',{
                userInfo:userInfo,
                users:users,
    
                count:count,
                limit:limit,
                pages:pages,
                page:page,
                pagename:'user'
            })
        });
    })
});
/**************************************************************/
// 分类首页
router.get('/category',function(req,res,next){
    var page=Number(req.query.page||1);
    var limit=2;
    var pages=0;

    Category.count().then(function(count){
        // 计算总页数
        pages=Math.ceil(count/limit );
        //取最大页数不能大于pages
        page=Math.min(page,pages);
        //取最小页数不能小于1
        page=Math.max(page,1);

        var skip=(page-1)*limit;

        /**
         * sort()
         * 1：升序-从小到大
         * 2：降序-从大到小
         */
        Category.find().sort({_id:-1}).limit(limit).skip(skip).then(function(categories){
            res.render('admin/category_index',{
                userInfo:userInfo,
                categories:categories,
    
                count:count,
                limit:limit,
                pages:pages,
                page:page,
                pagename:'category'

            })
        });
    })
});
// 分类添加
router.get('/category/add',function(req,res,next){
    res.render('admin/category_add',{
        userInfo:userInfo
    })
});
// 分类保存
router.post('/category/add',function(req,res,next){
    var name=req.body.name||'';
    if(name==''){
        res.render('admin/error',{
            userInfo:userInfo,
            message:'名称不能为空'
        });
    }
    // 数据库中是否已经存在同名分类名称
    Category.findOne({
        name:name
    }).then(function(rs){
        if(rs){
            // 数据库中已经存在该分类
            res.render('admin/error',{
                userInfo:userInfo,
                message:'分类已经存在了'
            });
            return Promise.reject();
        }else{
            // 数据库中不存在该分类，可以保存
            return new Category({
                name:name
            }).save();
        }
    }).then(function(newCategory){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'分类保存成功',
            url:'/admin/category'
        });
    });
});
// 分类修改
router.get('/category/edit',function(req,res,next){
    // 获取要修改的分类信息，并且用表单的形式展现处理
    var id=req.query.id||'';
    // 获取要修改的分类信息
    Category.findOne({
        _id:id
    }).then(function(category){
        if(!category){
            res.render('admin/error',{
                userInfo:userInfo,
                message:'分类信息不存在'
            })
        }else{
            res.render('admin/category_edit',{
                userInfo:userInfo,
                category:category
            })
        }
    });
});
// 分类修改保存
router.post('/category/edit',function(req,res,next){
    // 获取要修改的分类信息，并且用表单的形式展现处理
    var id=req.query.id||'';
    // 获取post提交过来的名称
    var name=req.body.name||'';
    Category.findOne({
        _id:id
    }).then(function(category){
        if(!category){
            res.render('admin/error',{
                userInfo:userInfo,
                message:'分类信息不存在'
            })
            return Promise.reject();
        }else{
            // 当用户没有做任何的修改提交的时候
            if(name==category.name){
                res.render('admin/success',{
                    userInfo:userInfo,
                    message:'修改成功',
                    url:'/admin/category'
                })
                return Promise.reject();
            }else{
                // 要修改的分类名称是否已经在数据库中存在
                return Category.findOne({
                    _id:{$ne:id},
                    name:name
                });
            }
        }
    }).then(function(sameCategory){
        if(sameCategory){
            res.render('admin/error',{
                userInfo:userInfo,
                message:'已存在同名分类'
            })
            return Promise.reject();
        }else{
            return Category.update({
                _id:id
            },{
                name:name
            })
        }
    }).then(function(){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'修改成功',
            url:'/admin/category'
        })
    });
});

// 分类删除
router.get('/category/delete',function(req,res,next){
    // 获取要删除的分类id
    var id=req.query.id||'';
    Category.remove({_id:id}).then(function(){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'删除成功',
            url:'/admin/category'
        })
    });
});

/**************************************************************/
// 内容首页
router.get('/content',function(req,res,next){
    var page=Number(req.query.page||1);
    var limit=2;
    var pages=0;

    Content.count().then(function(count){
        // 计算总页数
        pages=Math.ceil(count/limit );
        //取最大页数不能大于pages
        page=Math.min(page,pages);
        //取最小页数不能小于1
        page=Math.max(page,1);

        var skip=(page-1)*limit;

        /**
         * sort()
         * 1：升序-从小到大
         * 2：降序-从大到小
         */
        Content.find().sort({_id:-1}).limit(limit).skip(skip).populate(['category','user']).sort({addTime:-1}).then(function(contents){
            res.render('admin/content_index',{
                userInfo:userInfo,
                contents:contents,
    
                count:count,
                limit:limit,
                pages:pages,
                page:page,
                pagename:'content'

            })
        });
    })
});
// 内容添加
router.get('/content/add',function(req,res,next){
    Category.find().sort({_id:-1}).then(function(categories){
        res.render('admin/content_add',{
            userInfo:userInfo,
            categories:categories
        });
    });
});
// 内容保存
router.post('/content/add',function(req,res,next){
    var category=req.body.category||'';
    var title=req.body.title||'';
    var description=req.body.description||'';
    var content=req.body.content||'';
    if(category==''){
        res.render('admin/error',{
            userInfo:userInfo,
            message:'内容分类不能为空'
        });
        return;
    }
    if(title==''){
        res.render('admin/error',{
            userInfo:userInfo,
            message:'标题不能为空'
        });
        return;
    }
    //保存到数据库
    new Content({
        category:category,
        title:title,
        user:userInfo._id.toString(),
        description:description,
        content:content
    }).save().then(function(rs){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'内容保存成功',
            url:'/admin/content'
        });
    });
});
// 内容修改
router.get('/content/edit',function(req,res,next){
    var id=req.query.id||'';
    var categories=[];
    Category.find().sort({_id:-1}).then(function(rs){
        categories=rs;
        return Content.findOne({
            _id:id
        }).populate(['category','user'])
    }).then(function(content){
        if(!content){
            res.render('admin/error',{
                userInfo:userInfo,
                message:'内容不存在'
            });
            return Promise.reject();
        }else{
            res.render('admin/content_edit',{
                userInfo:userInfo,
                categories:categories,
                category:category
            })
        }
    });
});
// 内容修改保存
router.post('/content/edit',function(req,res,next){
    var id=req.query.id||'';

    var category=req.body.category||'';
    var title=req.body.title||'';
    var description=req.body.description||'';
    var content=req.body.content||'';
    if(category==''){
        res.render('admin/error',{
            userInfo:userInfo,
            message:'内容分类不能为空'
        });
        return;
    }
    if(title==''){
        res.render('admin/error',{
            userInfo:userInfo,
            message:'标题不能为空'
        });
        return;
    }
    //保存到数据库
    Content.update({
        _id:id
    },{
        category:category,
        title:title,
        description:description,
        content:content
    }).then(function(rs){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'内容保存成功',
            url:'/admin/content/edit?id='+id
        });
    });
});

// 内容删除
router.get('/content/delete',function(req,res,next){
    // 获取要删除的分类id
    var id=req.query.id||'';
    Content.remove({_id:id}).then(function(){
        res.render('admin/success',{
            userInfo:userInfo,
            message:'删除成功',
            url:'/admin/content'
        })
    });
});
/****************************************************************/
module.exports=router;


