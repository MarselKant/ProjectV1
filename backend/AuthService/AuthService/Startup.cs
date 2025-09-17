using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using AuthService.Context;
using AuthService.Model;
using AuthService.Services;
using Microsoft.Extensions.Configuration;

namespace AuthService
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<UserContext>(options =>
                options.UseSqlite("Data Source=/data/auth.db"));

            services.Configure<SmtpSettings>(Configuration.GetSection("SmtpSettings"));
            services.AddSingleton(provider =>
            {
                var config = provider.GetRequiredService<IConfiguration>();
                return config.GetSection("SmtpSettings").Get<SmtpSettings>();
            });

            services.AddScoped<EmailService>();

            services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    builder => builder
                        .WithOrigins("http://localhost:3000", "http://frontend:80")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
            });

            services.AddControllers();
            services.AddMvc(option => option.EnableEndpointRouting = false);


            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "Программа для производственной практики",
                    Description = ""
                });
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseCors("AllowFrontend");
            app.UseDeveloperExceptionPage();
            app.UseStatusCodePages();
            app.UseMvcWithDefaultRoute();
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Запросы");
            });
        }
    }
}