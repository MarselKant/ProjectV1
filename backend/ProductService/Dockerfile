FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore ProductService.sln
RUN dotnet build ProductService.sln -c Release -o /app/build
FROM build AS publish
RUN dotnet publish ProductService.sln -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
EXPOSE 7224
ENV ASPNETCORE_URLS=http://*:7224
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProductService.dll"]