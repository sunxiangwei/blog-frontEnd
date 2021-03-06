import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ArticleReq} from '../../class/Article';
import {EditorConfig} from '../../class/EditorConfig';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../api/api.service';
import {NzMessageService} from 'ng-zorro-antd';
import {User} from '../../class/User';
import {Tag} from '../../class/Tag';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'view-write',
    templateUrl: './write.component.html',
    styleUrls: ['./write.component.less']
})
export class WriteComponent implements OnInit {

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private apiService: ApiService,
                private message: NzMessageService,
                private titleService: Title) {
        this.titleService.setTitle('小海博客 | 创作');
    }

    modalVisible: boolean = false;
    conf = new EditorConfig();
    articleId: number;
    isUpdate = false;

    public article: ArticleReq = new ArticleReq();

    userInfo: User;
    categoryList: Tag[];
    tagNacList: { name: string, size: number }[];
    primaryData = {};
    // 发布新文章时，文章相同会被拦回 此处判断一下
    title: string;

    // 同步属性内容
    syncModel(str): void {
        this.article.mdContent = str;
    }


    ngOnInit(): void {
        this.articleId = this.activatedRoute.snapshot.queryParams.id;
        if (this.articleId != null) {
            this.isUpdate = true;
            this.getArticle();
        }
        if (!this.articleId && localStorage.getItem('tmpArticle')) {
            this.article = JSON.parse(localStorage.getItem('tmpArticle'));
        }
        this.setSuitableHeight();
        // 用户权限判断
        this.apiService.userInfo().subscribe({
            next: data => {
                this.userInfo = data.result;
                if (data.result.role !== 'admin') {
                    this.message.info('你暂时无发布文章的权限,所写文章将暂存在本地');
                }
            },
            error: e => {
                this.message.info('你暂时还没有登录，请点击右上角登录后开始创作');
            }
        });
        this.apiService.tagsNac().subscribe(data => {
            this.tagNacList = data.result;
            this.tagNacList.sort((a, b) => a.name.length - b.name.length);
        });
        this.apiService.categories().subscribe({
            next: data => {
                this.categoryList = data.result;
            },
            error: err => {
                this.message.error('获取分类信息失败');
            }
        });
    }

    /**
     * 设置高度
     */
    setSuitableHeight() {
        this.conf.height = (window.innerHeight - 120) + '';
    }

    // 提交按钮的事件
    articleSubmit() {
        this.modalVisible = true;
        if (this.article.title === '' || this.article.mdContent === '') {
            this.message.warning(this.article.title === '' ? '标题不能为空' : '文章不能为空');
            return;
        }

    }

    /**
     * 文章数据提交
     */
    publishArticle(e: { id: number, type: boolean, tags: string, category: string, url?: string }) {
        this.article.type = e.type;
        this.article.tags = e.tags;
        this.article.category = e.category;
        this.article.url = e.url;
        this.article.id = e.id;

        if (!this.article.id && this.title === this.article.title) {
            this.message.error('文章标题未经更改，请修改后再发布');
            return;
        }

        // 文章 暂存
        localStorage.setItem('tmpArticle', JSON.stringify(this.article));

        this.article.url = this.article.type ? null : this.article.url;

        if (!this.isUpdate) {
            // 非文章更新

            this.apiService.createArticle(this.article).subscribe({
                next: data => {
                    // TODO 成功
                    this.message.success('发布成功,即将转跳');
                    localStorage.removeItem('tmpArticle');

                    setTimeout(() => {
                        this.router.navigateByUrl('article/' + data.result.id);
                    }, 2500);
                },
                error: err => {
                    if (err.code === 3010) {
                        // 未登陆
                        this.router.navigateByUrl('/user/login');
                    }
                    if (err.code === 3020) {
                        this.message.error('你没有发布文章的权限,文章替你暂存在本地');
                    }
                }
            });

        } else {
            // 文章更新

            this.apiService.updateArticle(this.article).subscribe({
                next: data => {
                    this.message.success('更新成功，即将转跳');
                    localStorage.removeItem('tmpArticle');
                    setTimeout(() => {
                        this.router.navigateByUrl('article/' + data.result.id);
                    }, 2500);
                },
                error: e => {
                    if (e.code === 3010) {
                        this.router.navigateByUrl('login');
                    } else if (e.code === 3020) {
                        this.message.error('你没有更新文章的权限');
                    } else {
                        this.message.error('失败，原因：' + e.msg);
                    }
                }
            });
        }
    }

    /**
     * 获取文章 for  update
     */
    getArticle() {
        this.apiService.getArticle(this.articleId, true).subscribe({
            next: data => {
                this.article.category = data.result.category;
                this.article.mdContent = data.result.mdContent;
                this.article.tags = String(data.result.tags);
                this.article.type = data.result.original;
                this.article.url = data.result.url;
                this.article.title = data.result.title;
                this.article.id = data.result.id;
                this.title = data.result.title;
                this.primaryData = {
                    type: this.article.type,
                    tags: this.article.tags,
                    category: this.article.category,
                    url: this.article.url,
                    id: this.article.id
                };
            },
            error: e => {
                if (e.code === 2010) {
                    // 文章不存在
                    this.message.error('文章不存在');
                }
            }
        });
    }
}
